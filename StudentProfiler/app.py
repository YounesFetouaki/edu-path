from flask import Flask, jsonify
import pandas as pd
from sqlalchemy import create_engine
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# DB Config
DB_USER = os.getenv('POSTGRES_USER', 'admin')
DB_PASS = os.getenv('POSTGRES_PASSWORD', 'adminpassword')
DB_HOST = os.getenv('POSTGRES_HOST', 'postgres') # 'postgres' is the docker service name
DB_PORT = os.getenv('POSTGRES_PORT', '5432') # Internal port is 5432
DB_NAME = os.getenv('POSTGRES_DB', 'edupath_db')
DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

engine = create_engine(DATABASE_URI)

@app.route('/profiles', methods=['GET'])
def get_profiles():
    try:
        df = pd.read_sql("SELECT * FROM student_profiles", engine)
        return jsonify(df.to_dict(orient='records'))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/profiles/<int:student_id>', methods=['GET'])
def get_student_profile(student_id):
    try:
        df = pd.read_sql(f"SELECT * FROM student_profiles WHERE student_id = {student_id}", engine)
        if df.empty:
            return jsonify({"error": "Student not found"}), 404
        return jsonify(df.to_dict(orient='records')[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
