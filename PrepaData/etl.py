import pandas as pd
from sqlalchemy import create_engine
import os

DB_USER = os.getenv('POSTGRES_USER', 'admin')
DB_PASS = os.getenv('POSTGRES_PASSWORD', 'adminpassword')
DB_HOST = os.getenv('DB_HOST', 'postgres')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('POSTGRES_DB', 'edupath_db')

DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

def run_etl():
    print("Starting ETL Process...")
    engine = create_engine(DATABASE_URI)

    # 1. Extract
    print("Extracting data...")
    logs_df = pd.read_sql("SELECT * FROM student_logs", engine)
    students_df = pd.read_sql("SELECT * FROM students", engine)
    
    # Extract external dataset (e.g., from Kaggle)
    csv_file_path = 'external_data.csv'
    if os.path.exists(csv_file_path):
        print(f"Loading external dataset from {csv_file_path}...")
        external_df = pd.read_csv(csv_file_path)
    else:
        print(f"Warning: {csv_file_path} not found. Creating empty placeholder.")
        external_df = pd.DataFrame(columns=['student_id', 'additional_score', 'study_hours_external'])

    if logs_df.empty:
        print("No logs found. Skipping transformation.")
        return

    # 2. Transform
    print("Transforming data...")
    # Calculate Engagement Metrics
    engagement = logs_df.groupby('student_id').agg(
        total_actions=('log_id', 'count'),
        avg_score=('score', 'mean'),
        total_time=('duration_seconds', 'sum'),
        last_active=('timestamp', 'max')
    ).reset_index()

    # Normalize scores (0-100 scale assumed)
    engagement['avg_score'] = engagement['avg_score'].fillna(0)
    
    # Calculate Risk Score (Simple heuristic: Low score + Low activity = High Risk)
    # Risk calculation: 
    # High Risk if avg_score < 50 OR total_actions < 5
    engagement['risk_factor'] = 0.0
    engagement.loc[(engagement['avg_score'] < 50) | (engagement['total_actions'] < 10), 'risk_factor'] = 1.0
    engagement.loc[(engagement['avg_score'] >= 50) & (engagement['avg_score'] < 70), 'risk_factor'] = 0.5
    
    # Merge with student info
    final_df = pd.merge(students_df[['student_id', 'email']], engagement, on='student_id', how='left')
    
    # Merge with External Data
    final_df = pd.merge(final_df, external_df, on='student_id', how='left')
    
    # Fill NaN values for new columns
    final_df[['total_actions', 'total_time', 'risk_factor', 'additional_score', 'study_hours_external']] = final_df[['total_actions', 'total_time', 'risk_factor', 'additional_score', 'study_hours_external']].fillna(0)
    final_df['avg_score'] = final_df['avg_score'].fillna(0)

    # 3. Load
    print("Loading data into 'student_analytics'...")
    final_df.to_sql('student_analytics', engine, if_exists='replace', index=False)
    print("ETL Complete. Data loaded.")

if __name__ == "__main__":
    try:
        run_etl()
    except Exception as e:
        print(f"ETL Failed: {e}")
