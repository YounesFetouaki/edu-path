import os
import random
import pandas as pd
from sqlalchemy import create_engine, text
from faker import Faker
from datetime import datetime, timedelta

# Configuration
DB_USER = os.getenv('POSTGRES_USER', 'admin')
DB_PASS = os.getenv('POSTGRES_PASSWORD', 'adminpassword')
DB_HOST = os.getenv('DB_HOST', 'localhost')
# If running on localhost (default), use mapped port 5433. If inside docker (hostname 'postgres'), use 5432.
default_port = '5433' if DB_HOST == 'localhost' else '5432'
DB_PORT = os.getenv('DB_PORT', default_port)
DB_NAME = os.getenv('POSTGRES_DB', 'edupath_db')

DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

fake = Faker()

def get_engine():
    try:
        engine = create_engine(DATABASE_URI)
        return engine
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        return None

def create_logs_table(engine):
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS student_logs (
                log_id SERIAL PRIMARY KEY,
                student_id INTEGER,
                activity_type VARCHAR(50),
                score INTEGER,
                duration_seconds INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        conn.commit()
    print("Ensured student_logs table exists.")

def generate_logs(engine, num_logs_per_student=10):
    print("Generating student logs...")
    
    # Fetch students
    try:
        students_df = pd.read_sql("SELECT id FROM students", engine)
        student_ids = students_df['id'].tolist()
    except Exception as e:
        print(f"Error fetching students: {e}")
        return

    if not student_ids:
        print("No students found. Please seed users first.")
        return

    logs = []
    activities = ['login', 'view_course', 'submit_assignment', 'view_forum', 'take_quiz']
    
    for s_id in student_ids:
        # Randomize engagement level per student
        engagement_level = random.choice(['high', 'medium', 'low'])
        count = num_logs_per_student
        
        if engagement_level == 'high': count = random.randint(15, 30)
        elif engagement_level == 'medium': count = random.randint(5, 15)
        else: count = random.randint(0, 5)

        for _ in range(count):
            act = random.choice(activities)
            score = None
            if act in ['submit_assignment', 'take_quiz']:
                score = random.randint(40, 100)
            
            duration = random.randint(10, 3600) # seconds
            ts = fake.date_this_year()
            
            logs.append({
                'student_id': s_id,
                'activity_type': act,
                'score': score,
                'duration_seconds': duration,
                'timestamp': ts
            })

    if logs:
        logs_df = pd.DataFrame(logs)
        logs_df.to_sql('student_logs', engine, if_exists='append', index=False)
        print(f"Inserted {len(logs)} logs.")
    else:
        print("No logs generated.")

def generate_external_data(engine):
    print("Generating external_data.csv...")
    try:
        students_df = pd.read_sql("SELECT id FROM students", engine)
        student_ids = students_df['id'].tolist()
    except:
        return

    external_data = []
    for s_id in student_ids:
        external_data.append({
            'student_id': s_id,
            'additional_score': random.randint(0, 50), # Some external certification score
            'study_hours_external': random.randint(0, 100)
        })
    
    df = pd.DataFrame(external_data)
    # Save to the directory where this script is located
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, 'external_data.csv')
    df.to_csv(file_path, index=False)
    print(f"Saved external data to {file_path}")

def main():
    engine = get_engine()
    if not engine: return
    
    create_logs_table(engine)
    generate_logs(engine)
    generate_external_data(engine)

if __name__ == "__main__":
    main()
