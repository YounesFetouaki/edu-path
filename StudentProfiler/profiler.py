
import pandas as pd
from sqlalchemy import create_engine
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import os

DB_USER = 'admin'
DB_PASS = 'adminpassword'
DB_HOST = os.getenv('DB_HOST', 'postgres')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = 'edupath_db'
DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

def run_profiler():
    print("Starting Student Profiler...")
    engine = create_engine(DATABASE_URI)

    # 1. Load Analytic Data
    df = pd.read_sql("SELECT * FROM student_analytics", engine)
    
    if df.empty:
        print("No analytics data found.")
        return

    # Features for clustering
    features = ['avg_score', 'total_actions', 'total_time']
    X = df[features].fillna(0)

    # 2. Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 3. Cluster (K=3: Struggling, Average, High Performing)
    print("Running KMeans (k=3)...")
    kmeans = KMeans(n_clusters=3, random_state=42)
    clusters = kmeans.fit_predict(X_scaled)
    
    # 4. Save results back
    df['cluster_label'] = clusters
    
    # Map cluster centers to semantic names
    # Heuristic: Compare mean score of clusters
    df['profile_type'] = 'Unknown'
    
    cluster_stats = df.groupby('cluster_label')['avg_score'].mean()
    sorted_clusters = cluster_stats.sort_values() # Ascending: 0=Lowest, 2=Highest
    
    risk_cluster = sorted_clusters.index[0]
    avg_cluster = sorted_clusters.index[1]
    high_cluster = sorted_clusters.index[2]
    
    df.loc[df['cluster_label'] == risk_cluster, 'profile_type'] = 'At Risk'
    df.loc[df['cluster_label'] == avg_cluster, 'profile_type'] = 'Standard'
    df.loc[df['cluster_label'] == high_cluster, 'profile_type'] = 'High Achiever'

    print("Profiles assigned:")
    print(df['profile_type'].value_counts())

    # Save to DB (Update or separate table? Let's write to student_profiles)
    print("Saving to 'student_profiles' table...")
    df[['student_id', 'email', 'cluster_label', 'profile_type']].to_sql('student_profiles', engine, if_exists='replace', index=False)
    
    print("Profiling Complete.")

if __name__ == "__main__":
    run_profiler()
