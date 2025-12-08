const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'edupath_db',
  password: process.env.DB_PASSWORD || 'adminpassword',
  port: process.env.DB_PORT || 5433,
});

async function runQuery(client, name, sql) {
  try {
    await client.query(sql);
    console.log(`[OK] ${name}`);
  } catch (e) {
    console.error(`[FAIL] ${name}: ${e.message}`);
    throw e;
  }
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding - Masterpiece Phase 2 (Grades & Flow)');

    // DROP ALL
    await runQuery(client, 'Drop All', `
      DROP TABLE IF EXISTS grades, student_gamification, quiz_questions, quizzes, assignments, chapters, modules, courses, students CASCADE
    `);

    // TABLES
    await runQuery(client, 'Create students', `
      CREATE TABLE students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        persona VARCHAR(50) DEFAULT 'Standard',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runQuery(client, 'Create courses', `
      CREATE TABLE courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100),
        description TEXT,
        category VARCHAR(50),
        thumbnail_url VARCHAR(255)
      )
    `);

    await runQuery(client, 'Create modules', `
      CREATE TABLE modules (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id),
        title VARCHAR(100),
        order_index INTEGER
      )
    `);

    await runQuery(client, 'Create chapters', `
      CREATE TABLE chapters (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES modules(id),
        title VARCHAR(100),
        content_type VARCHAR(20),
        content_url TEXT,
        duration_minutes INTEGER
      )
    `);

    await runQuery(client, 'Create assignments', `
      CREATE TABLE assignments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        title VARCHAR(100),
        description TEXT,
        due_date TIMESTAMP,
        status VARCHAR(20) DEFAULT 'Pending',
        teacher_id INTEGER
      )
    `);

    await runQuery(client, 'Create quizzes', `
      CREATE TABLE quizzes (
        id SERIAL PRIMARY KEY,
        chapter_id INTEGER REFERENCES chapters(id),
        title VARCHAR(100)
      )
    `);

    await runQuery(client, 'Create quiz_questions', `
      CREATE TABLE quiz_questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES quizzes(id),
        question_text TEXT,
        options TEXT, 
        correct_option INTEGER
      )
    `);

    await runQuery(client, 'Create student_gamification', `
      CREATE TABLE student_gamification (
        student_id INTEGER PRIMARY KEY REFERENCES students(id),
        points INTEGER DEFAULT 0,
        badges TEXT DEFAULT '[]',
        streak_days INTEGER DEFAULT 0
      )
    `);

    // NEW: Gradebook
    await runQuery(client, 'Create grades', `
      CREATE TABLE grades (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        quiz_id INTEGER REFERENCES quizzes(id),
        score INTEGER,
        max_score INTEGER,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // INSERT DATA
    console.log('Inserting Data...');

    // 1. Students
    const studentRes = await client.query(`
      INSERT INTO students (name, email, persona) VALUES 
      ('Alex Risk', 'alex@risk.com', 'Risk'),
      ('Sarah Star', 'sarah@star.com', 'Star')
      RETURNING id, name;
    `);
    const alexId = studentRes.rows[0].id;
    const sarahId = studentRes.rows[1].id;

    // 2. Courses
    const courseRes = await client.query(`
      INSERT INTO courses (title, description, category, thumbnail_url) VALUES
      ('Intro to AI', 'Learn the basics of Artificial Intelligence.', 'CS', 'https://via.placeholder.com/150'),
      ('Web Development', 'Master React and Modern CSS.', 'Web', 'https://via.placeholder.com/150')
      RETURNING id, title;
    `);
    const aiId = courseRes.rows[0].id;

    // Modules for AI
    const aiModuleRes = await client.query(`
      INSERT INTO modules (course_id, title, order_index) VALUES
      ($1, 'Neural Networks', 1),
      ($1, 'Deep Learning', 2)
      RETURNING id, title;
    `, [aiId]);
    const moduleId = aiModuleRes.rows[0].id;

    // Chapters for Neural Networks
    // 1. Video
    await client.query(`
      INSERT INTO chapters (module_id, title, content_type, content_url, duration_minutes) VALUES
      ($1, 'What is a Perceptron?', 'video', 'https://www.youtube.com/watch?v=kft1AJ9WVDk', 10),
      ($1, 'Activation Functions', 'text', 'ReLU (Rectified Linear Unit) is widespread...', 15)
    `, [moduleId]);

    // 2. Quiz Chapter
    const quizChapterRes = await client.query(`
      INSERT INTO chapters (module_id, title, content_type, duration_minutes) VALUES
      ($1, 'Neural Net Quiz', 'quiz', 20)
      RETURNING id;
    `, [moduleId]);
    const quizChapterId = quizChapterRes.rows[0].id;

    // Create Quiz
    const realQuizRes = await client.query(`
      INSERT INTO quizzes (chapter_id, title) VALUES ($1, 'Neural Networks Basics') RETURNING id;
    `, [quizChapterId]);
    const quizId = realQuizRes.rows[0].id;

    // Add Questions
    await client.query(`
      INSERT INTO quiz_questions (quiz_id, question_text, options, correct_option) VALUES
      ($1, 'What is the most common activation function?', '["Sigmoid", "ReLU", "Tanh", "Linear"]', 1),
      ($1, 'Which component updates weights?', '["Optimizer", "Loss Function", "Layer", "Input"]', 0)
    `, [quizId]);

    // Assignments
    await client.query(`
      INSERT INTO assignments (student_id, title, description, due_date, status, teacher_id) VALUES
      ($1, 'Remedial: Math for AI', 'Please review linear algebra basics.', NOW() + INTERVAL '3 days', 'Pending', 1)
    `, [alexId]);

    // Gamification
    await client.query(`
      INSERT INTO student_gamification (student_id, points, badges, streak_days) VALUES
      ($1, 50, '["Newbie"]', 1),
      ($2, 1200, '["Fast Learner", "Quiz Master"]', 5)
    `, [alexId, sarahId]);

    // Grades (Seed Data)
    await client.query(`
      INSERT INTO grades (student_id, quiz_id, score, max_score, submitted_at) VALUES
      ($1, $2, 40, 100, NOW() - INTERVAL '2 days'), -- Alex Failed
      ($3, $2, 95, 100, NOW() - INTERVAL '1 day')   -- Sarah Aced
    `, [alexId, quizId, sarahId]);

    console.log('Seeding Complete - Masterpiece Ready!');

  } catch (err) {
    console.error('Final Error Handler:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
