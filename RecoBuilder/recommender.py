import pandas as pd
from sqlalchemy import create_engine, text
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pickle
import os

# DB Config
DB_USER = 'admin'
DB_PASS = 'adminpassword'
DB_HOST = '127.0.0.1'
DB_PORT = '5433'
DB_NAME = 'edupath_db'
DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

model = SentenceTransformer('all-MiniLM-L6-v2')
index = None
resources_df = None

def init_resources(engine):
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS resources (
                resource_id SERIAL PRIMARY KEY,
                title VARCHAR(255),
                content_type VARCHAR(50),
                topic VARCHAR(100),
                difficulty_level FLOAT
            );
        """))
        conn.commit()
        
        result = conn.execute(text("SELECT count(*) FROM resources"))
        count = result.scalar()
        
        if count == 0:
            print("Seeding mock resources...")
            mock_data = [
                {"title": "Intro to Python Data Structures", "content_type": "video", "topic": "CS", "difficulty": 1.0},
                {"title": "Understanding Gradient Descent", "content_type": "article", "topic": "AI", "difficulty": 3.0},
                {"title": "Advanced SQL Queries", "content_type": "video", "topic": "CS", "difficulty": 2.5},
                {"title": "Probability Distributions 101", "content_type": "pdf", "topic": "Data", "difficulty": 2.0},
                {"title": "Transformer Architecture Explained", "content_type": "article", "topic": "AI", "difficulty": 4.0},
                {"title": "Pandas DataFrame Mastery", "content_type": "video", "topic": "Data", "difficulty": 1.5},
                {"title": "React Hooks Deep Dive", "content_type": "video", "topic": "Web", "difficulty": 2.0},
                {"title": "PostgreSQL Indexing Strategies", "content_type": "article", "topic": "CS", "difficulty": 3.5}
            ]
            for r in mock_data:
                conn.execute(text("INSERT INTO resources (title, content_type, topic, difficulty_level) VALUES (:title, :content_type, :topic, :difficulty)"), r)
            conn.commit()

def build_index():
    global index, resources_df
    print("Building Recommendation Index...")
    engine = create_engine(DATABASE_URI)
    init_resources(engine)
    
    resources_df = pd.read_sql("SELECT * FROM resources", engine)
    
    if resources_df.empty:
        print("No resources to index.")
        return

    # Create Embeddings
    print("Encoding titles...")
    embeddings = model.encode(resources_df['title'].tolist())
    
    # FAISS Index
    d = embeddings.shape[1]
    index = faiss.IndexFlatL2(d)
    index.add(np.array(embeddings).astype('float32'))
    
    with open("faiss_index.pkl", "wb") as f:
        pickle.dump((index, resources_df), f)
    print("Index built and saved.")

def recommend(query_text, k=3):
    if index is None:
        load_index()
    
    vec = model.encode([query_text])
    D, I = index.search(np.array(vec).astype('float32'), k)
    
    results = []
    for idx in I[0]:
        if idx < len(resources_df):
            results.append(resources_df.iloc[idx].to_dict())
    return results

def load_index():
    global index, resources_df
    if os.path.exists("faiss_index.pkl"):
        with open("faiss_index.pkl", "rb") as f:
            index, resources_df = pickle.load(f)
    else:
        build_index()

if __name__ == "__main__":
    build_index()
