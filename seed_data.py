import os
import random
import time
from datetime import datetime, timedelta
# Try importing faker, if not present we will generate simple data
try:
    from faker import Faker
    fake = Faker()
except ImportError:
    class Faker:
        def name(self): return f"User_{random.randint(1000,9999)}"
        def email(self): return f"user{random.randint(1000,9999)}@example.com"
        def user_name(self): return f"user_{random.randint(1000,9999)}"
        def paragraph(self): return "Lorem ipsum content for testing."
        def sentence(self): return "Short sentence description."
        def image_url(self): return "http://placehold.it/200x200"
        def date_this_year(self): return datetime.now() - timedelta(days=random.randint(0, 365))
    fake = Faker()

import psycopg2
from psycopg2 import sql

from sqlalchemy import create_engine

# DB Config (Environment variables or default for Docker internal)
DB_USER = os.getenv('POSTGRES_USER', 'admin')
DB_PASS = os.getenv('POSTGRES_PASSWORD', 'adminpassword')
DB_HOST = os.getenv('DB_HOST', 'localhost') 

# Logic to handle local execution vs docker
if DB_HOST == 'localhost':
    # DB_HOST = '127.0.0.1' 
    DB_PORT = os.getenv('DB_PORT', '5433') 
else:
    DB_PORT = os.getenv('DB_PORT', '5432') 

DB_NAME = os.getenv('POSTGRES_DB', 'edupath_db')
DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

def get_db_connection():
    try:
        engine = create_engine(DATABASE_URI)
        conn = engine.raw_connection()
        return conn
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        return None

def seed_users(cur, count=50):
    print(f"Seeding {count} users...")
    users = []
    # Add fixed demo users
    users.append(('student', 'student@edupath.com', 'password', 'STUDENT'))
    users.append(('teacher', 'teacher@edupath.com', 'password', 'TEACHER'))
    users.append(('admin', 'admin@edupath.com', 'admin', 'ADMIN'))

    for _ in range(count):
        username = fake.user_name()
        email = f"{username}_{random.randint(1,999)}@edupath.com"
        password = 'password' 
        role = 'STUDENT'
        users.append((username, email, password, role))

    insert_query = """
    INSERT INTO users (username, email, password_hash, role)
    VALUES %s
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email, role;
    """
    
    # Execute batch insert is tricky with raw psycopg2 depending on version, doing loop for simplicity/safety with conflict
    ids = []
    for u in users:
        try:
            cur.execute("INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s) ON CONFLICT (email) DO UPDATE SET role=EXCLUDED.role RETURNING id, email, role", u)
            res = cur.fetchone()
            if res:
                ids.append(res)
        except Exception as e:
            print(f"Skipping user {u[1]}: {e}")
    
    return ids

def seed_students(cur, user_data):
    print(f"Seeding students profiles for {len(user_data)} users...")
    for u_id, email, role in user_data:
        if role != 'STUDENT': continue
        
        name = fake.name()
        persona = random.choice(['At Risk', 'High Achiever', 'Standard', 'At Risk', 'Standard'])
        
        cur.execute("""
            INSERT INTO students (user_id, name, email, persona)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (email) DO NOTHING
        """, (u_id, name, email, persona))

def seed_courses(cur, count=10):
    print(f"Seeding {count} courses...")
    cur.execute("SELECT COUNT(*) FROM courses")
    if cur.fetchone()[0] > 0:
        print("Courses already exist, skipping...")
        return

    categories = ['Math', 'Science', 'History', 'Programming', 'Art']
    for i in range(count):
        title = f"Intro to {fake.sentence()}"[:50]
        desc = fake.paragraph()
        cat = random.choice(categories)
        thumb = f"https://picsum.photos/seed/{i}/300/200"
        
        cur.execute("INSERT INTO courses (title, description, category, thumbnail_url) VALUES (%s, %s, %s, %s) RETURNING id", 
                    (title, desc, cat, thumb))
        course_id = cur.fetchone()[0]
        
        
        # Seed Modules
        for m in range(random.randint(2, 5)):
            cur.execute("INSERT INTO modules (course_id, title, order_index) VALUES (%s, %s, %s) RETURNING id",
                        (course_id, f"Module {m+1}: {fake.sentence()}"[:40], m))
            mod_id = cur.fetchone()[0]

            # Seed Chapters
            for ch in range(random.randint(2, 4)):
                 cur.execute("INSERT INTO chapters (module_id, title, content_type, content_url, duration_minutes) VALUES (%s, %s, %s, %s, %s)",
                        (mod_id, f"Chapter {ch+1}: {fake.sentence()}"[:40], 'video', "https://www.youtube.com/watch?v=dQw4w9WgXcQ", 15))

def seed_quizzes(cur, count=15):
    print(f"Seeding {count} quizzes...")
    cur.execute("SELECT COUNT(*) FROM quizzes")
    count_exist = cur.fetchone()[0]
    if count_exist > 0:
        print("Quizzes already exist.")
        return

    topics = ['React Hooks', 'Python Basics', 'History of Rome', 'Quantum Physics', 'Linear Algebra']
    
    for i in range(count):
        topic = random.choice(topics)
        title = f"{topic} Quiz {i+1}"
        cur.execute("""
            INSERT INTO quizzes (title, topic, total_questions, created_at)
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (title, topic, 5, fake.date_this_year()))

def seed_assignments(cur, class_ids, count_per_class=3):
    print(f"Seeding assignments for {len(class_ids)} classes...")
    
    if not class_ids:
        print("No classes provided.")
        return

    titles = ["React Project", "History Essay", "Lab Report", "Algorithm Analysis", "Art Portfolio"]
    
    for c_id in class_ids:
        for _ in range(count_per_class):
            title = f"{random.choice(titles)} - {fake.word().capitalize()}"
            desc = fake.paragraph()
            due = fake.date_this_year() + timedelta(days=random.randint(5, 30))
            
            # Get teacher for this class
            cur.execute("SELECT teacher_id FROM teacher_classes WHERE class_id = %s", (c_id,))
            res = cur.fetchone()
            t_id = res[0] if res else 1 # Fallback
            
            try:
                cur.execute("""
                    INSERT INTO assignments (class_id, title, description, due_date, teacher_id)
                    VALUES (%s, %s, %s, %s, %s)
                """, (c_id, title, desc, due, t_id))
            except Exception as e:
                print(f"Failed to insert assignment: {e}")

def seed_grades(cur):
    print("Seeding grades for students...")
    cur.execute("SELECT id FROM students")
    students = [row[0] for row in cur.fetchall()]
    
    cur.execute("SELECT id, title FROM quizzes")
    quizzes = cur.fetchall()
    
    if not students or not quizzes:
        return

    for s_id in students:
        # Assign 2-5 grades per student
        student_quizzes = random.sample(quizzes, k=random.randint(2, 5))
        for q_id, q_title in student_quizzes:
            score = random.randint(40, 100)
            passed = score >= 60
            submitted = fake.date_this_year()
            
            cur.execute("""
                INSERT INTO grades (student_id, quiz_id, quiz_title, score, max_score, submitted_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (s_id, q_id, q_title, score, 100, submitted))

def main():
    print("Waiting for DB...")
    time.sleep(2) # Give a moment
    conn = get_db_connection()
    if not conn:
        print("Failed to connect.")
        return
    
    conn.autocommit = True
    cur = conn.cursor()
    
    # 1. Ensure tables exist (Run schema if needed, but assuming schema.sql applied via tool or docker-entrypoint)
    # We can run the CREATE TABLEs here just in case
    cur.execute("DROP TABLE IF EXISTS students CASCADE;")
    cur.execute("DROP TABLE IF EXISTS users CASCADE;")
    cur.execute("DROP TABLE IF EXISTS courses CASCADE;") # might as well refresh everything
    cur.execute("DROP TABLE IF EXISTS chapters CASCADE;")
    cur.execute("DROP TABLE IF EXISTS modules CASCADE;")
    cur.execute("DROP TABLE IF EXISTS student_profiles CASCADE;")
    cur.execute("DROP TABLE IF EXISTS teacher_classes CASCADE;")
    cur.execute("DROP TABLE IF EXISTS classes CASCADE;")
    cur.execute("DROP TABLE IF EXISTS quizzes CASCADE;")
    cur.execute("DROP TABLE IF EXISTS assignments CASCADE;")
    cur.execute("DROP TABLE IF EXISTS grades CASCADE;")
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'STUDENT',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100)
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS teacher_classes (
      teacher_id INTEGER REFERENCES users(id),
      class_id INTEGER REFERENCES classes(id),
      PRIMARY KEY (teacher_id, class_id)
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      class_id INTEGER REFERENCES classes(id),
      name VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      persona VARCHAR(50) DEFAULT 'Standard',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100),
      description TEXT,
      category VARCHAR(50),
      thumbnail_url VARCHAR(255),
      teacher_id INTEGER
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS modules (
      id SERIAL PRIMARY KEY,
      course_id INTEGER REFERENCES courses(id),
      title VARCHAR(100),
      order_index INTEGER
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS chapters (
      id SERIAL PRIMARY KEY,
      module_id INTEGER REFERENCES modules(id),
      title VARCHAR(100),
      content_type VARCHAR(50) DEFAULT 'video',
      content_url VARCHAR(255),
      duration_minutes INTEGER DEFAULT 10,
      content TEXT,
      video_url VARCHAR(255)
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100),
      topic VARCHAR(100),
      total_questions INTEGER DEFAULT 5,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      class_id INTEGER REFERENCES classes(id),
      title VARCHAR(255),
      description TEXT,
      due_date TIMESTAMP,
      teacher_id INTEGER,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS grades (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id),
      quiz_id INTEGER REFERENCES quizzes(id),
      quiz_title VARCHAR(100),
      score INTEGER,
      max_score INTEGER,
      submitted_at TIMESTAMP
    );
    """)
    
    # Create student_profiles table (used by Profiler service)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS student_profiles (
      student_id INTEGER PRIMARY KEY,
      email VARCHAR(100),
      cluster_label INTEGER,
      profile_type VARCHAR(50)
    );
    """)

    # 2. Seed Data
    user_data = seed_users(cur, count=100) 
    
    # Identify Teachers
    teachers = [u for u in user_data if u[2] == 'TEACHER'] # user_data comes as (id, email, role) from SQL RETURNING
    
    # Seed Classes
    print("Seeding classes...")
    class_ids = []
    class_names = ["Math 101", "Physics 2A", "Biology 1B", "CS 101", "History 5", "Literature 10"]
    for c_name in class_names:
        cur.execute("INSERT INTO classes (name) VALUES (%s) RETURNING id", (c_name,))
        class_ids.append(cur.fetchone()[0])
        
    # Assign Teachers to Classes
    print("Assigning teachers to classes...")
    for t_id in [t[0] for t in teachers]:
        # Assign 2 random classes to each teacher
        assigned = random.sample(class_ids, 2)
        for c_id in assigned:
            cur.execute("INSERT INTO teacher_classes (teacher_id, class_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (t_id, c_id))

    # Seed Students with Classes
    print(f"Seeding students profiles for {len(user_data)} users...")
    for u_id, email, role in user_data:
        if role != 'STUDENT': continue
        
        name = fake.name()
        persona = random.choice(['At Risk', 'High Achiever', 'Standard', 'At Risk', 'Standard'])
        class_id = random.choice(class_ids) # Assign to random class
        
        cur.execute("""
            INSERT INTO students (user_id, class_id, name, email, persona)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (email) DO NOTHING
        """, (u_id, class_id, name, email, persona))

    seed_courses(cur, count=20)
    seed_quizzes(cur, count=15)
    seed_assignments(cur, class_ids)
    seed_grades(cur)
    
    # Seed student_profiles
    print("Seeding student_profiles...")
    cur.execute("SELECT id, email, persona FROM students")
    students = cur.fetchall()
    for s in students:
        s_id, email, persona = s
        # Map persona to simple cluster
        cluster = 0
        if persona == 'At Risk': cluster = 2
        elif persona == 'High Achiever': cluster = 1
        
        cur.execute("INSERT INTO student_profiles (student_id, email, cluster_label, profile_type) VALUES (%s, %s, %s, %s) ON CONFLICT (student_id) DO NOTHING",
                    (s_id, email, cluster, persona))
    
    print("Seeding Complete!")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
