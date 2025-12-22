import pandas as pd
import sys
import os
from unittest.mock import MagicMock, patch

# Add parent directory to path so we can import etl
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock SQLAlchemy engine
sys.modules['sqlalchemy'] = MagicMock()
sys.modules['sqlalchemy'].create_engine = MagicMock()

# Mock data
mock_logs = pd.DataFrame({
    'log_id': range(1, 11),
    'student_id': [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
    'score': [80, 85, 90, 95, 40, 45, 60, 65, 70, 75],
    'duration_seconds': [100] * 10,
    'timestamp': pd.to_datetime(['2023-01-01'] * 10)
})

mock_students = pd.DataFrame({
    'student_id': range(1, 6),
    'email': [f'student{i}@test.com' for i in range(1, 6)]
})

def mock_read_sql(query, con):
    if "student_logs" in query:
        return mock_logs
    elif "students" in query:
        return mock_students
    return pd.DataFrame()

def mock_to_sql(self, name, con, if_exists, index):
    print(f"\n[Mock to_sql] Writing to table '{name}':")
    print(self)

# Patch pandas
with patch('pandas.read_sql', side_effect=mock_read_sql):
    with patch('pandas.DataFrame.to_sql', mock_to_sql):
        import etl  # Import your script here
        
        print("Running ETL verification...")
        etl.run_etl()
