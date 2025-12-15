CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'STUDENT', -- 'ADMIN', 'TEACHER', 'STUDENT'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  teacher_id INTEGER -- Optional direct link, but mostly use junction table
);

CREATE TABLE IF NOT EXISTS teacher_classes (
  teacher_id INTEGER REFERENCES users(id),
  class_id INTEGER REFERENCES classes(id),
  PRIMARY KEY (teacher_id, class_id)
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  class_id INTEGER REFERENCES classes(id),
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  persona VARCHAR(50) DEFAULT 'Standard', -- 'Risk', 'Star', 'Standard'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100),
  description TEXT,
  category VARCHAR(50),
  thumbnail_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  title VARCHAR(100),
  order_index INTEGER
);

CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id),
  title VARCHAR(100),
  content_type VARCHAR(20), -- 'video', 'text', 'quiz'
  content_url TEXT, -- Link to video or text content
  duration_minutes INTEGER
);

CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  title VARCHAR(100),
  description TEXT,
  due_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Completed'
  teacher_id INTEGER
);

CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id),
  title VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id),
  question_text TEXT,
  options JSONB, -- ["A", "B", "C", "D"]
  correct_option INTEGER -- Index of correct option
);

CREATE TABLE IF NOT EXISTS student_gamification (
  student_id INTEGER PRIMARY KEY REFERENCES students(id),
  points INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]',
  streak_days INTEGER DEFAULT 0
);
