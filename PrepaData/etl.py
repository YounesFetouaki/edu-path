DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

def run_etl():
    print("Starting ETL Process...")
    engine = create_engine(DATABASE_URI)

    # 1. Extract
    print("Extracting data...")
    logs_df = pd.read_sql("SELECT * FROM student_logs", engine)
    students_df = pd.read_sql("SELECT * FROM students", engine)

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
    final_df[['total_actions', 'total_time', 'risk_factor']] = final_df[['total_actions', 'total_time', 'risk_factor']].fillna(0)
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
