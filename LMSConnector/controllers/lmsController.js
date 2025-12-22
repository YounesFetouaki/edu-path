const db = require('../config/db');
const LocalLMSAdaptor = require('../services/LocalLMSAdaptor');

const adaptor = new LocalLMSAdaptor();


exports.getAllCourses = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM courses ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCourseDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const course = await db.query('SELECT * FROM courses WHERE id = $1', [id]);
        if (course.rows.length === 0) return res.status(404).json({ error: 'Course not found' });

        const modules = await db.query('SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index', [id]);

        // Enrich modules with chapters
        const modulesWithChapters = await Promise.all(modules.rows.map(async (mod) => {
            const chapters = await db.query('SELECT * FROM chapters WHERE module_id = $1', [mod.id]);
            return { ...mod, chapters: chapters.rows };
        }));

        res.json({ ...course.rows[0], modules: modulesWithChapters });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAssignments = async (req, res) => {
    const { studentId } = req.params;
    try {
        // 1. Get Student's Class
        const student = await db.query('SELECT class_id FROM students WHERE id = $1', [studentId]);
        if (student.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        
        const classId = student.rows[0].class_id;
        
        // 2. Fetch Assignments for that Class
        const result = await db.query('SELECT * FROM assignments WHERE class_id = $1 ORDER BY due_date ASC', [classId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const { teacherId } = req.query;
        let query = 'SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id';
        let params = [];

        if (teacherId) {
            query = `
                SELECT s.*, c.name as class_name 
                FROM students s 
                JOIN classes c ON s.class_id = c.id
                JOIN teacher_classes tc ON c.id = tc.class_id 
                WHERE tc.teacher_id = $1
            `;
            params = [teacherId];
        } else {
            query += ' ORDER BY s.id ASC';
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.assignTask = async (req, res) => {
    const { classId, title, description, teacherId, dueDate } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO assignments (class_id, title, description, due_date, teacher_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [classId, title, description, dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), teacherId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- NEW MASTERPIECE FUNCTIONS ---

exports.getGrades = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await db.query(`
            SELECT g.*, q.title as quiz_title 
            FROM grades g
            JOIN quizzes q ON g.quiz_id = q.id
            WHERE g.student_id = $1
            ORDER BY g.submitted_at DESC
        `, [studentId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.submitGrade = async (req, res) => {
    try {
        const { studentId, quizId, score, maxScore } = req.body;
        const result = await db.query(`
            INSERT INTO grades (student_id, quiz_id, score, max_score)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [studentId, quizId, score, maxScore]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getCourseStructure = async (req, res) => {
    try {
        const { id } = req.params;
        // Fetch Modules
        const modules = await db.query('SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index', [id]);

        // Fetch Chapters for each module
        const result = [];
        for (const mod of modules.rows) {
            const chapters = await db.query('SELECT * FROM chapters WHERE module_id = $1 ORDER BY id', [mod.id]);
            result.push({ ...mod, chapters: chapters.rows });
        }
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const quiz = await db.query('SELECT * FROM quizzes WHERE id = $1', [id]);
        if (quiz.rows.length === 0) return res.status(404).json({ error: 'Quiz not found' });

        const questions = await db.query('SELECT * FROM quiz_questions WHERE quiz_id = $1', [id]);

        // Parse options if they are strings (JSON)
        const parsedQuestions = questions.rows.map(q => {
            let options = q.options;
            if (typeof options === 'string') {
                try { options = JSON.parse(options); } catch (e) { }
            }
            return { ...q, options };
        });

        res.json({ ...quiz.rows[0], questions: parsedQuestions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { title, description, category, teacherId, thumbnail_url } = req.body;
        const result = await db.query(
            'INSERT INTO courses (title, description, category, teacher_id, thumbnail_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, category, teacherId || 1, thumbnail_url]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.syncData = async (req, res) => {
    try {
        console.log("Starting LMS Sync...");
        
        // 1. Connect
        const connected = await adaptor.connect();
        if (!connected) {
            return res.status(503).json({ error: "Failed to connect to LMS" });
        }

        // 2. Prepare Data (ETL)
        // Note: successful preparation returns stdout usually
        await adaptor.prepareData();

        // 3. Fetch Result
        const data = await adaptor.fetchData();

        res.json({ message: "Sync Complete", data });
    } catch (err) {
        console.error("Sync Error:", err);
        res.status(500).json({ error: err.message });
    }
};


// --- Content Management Controllers ---

exports.createModule = async (req, res) => {
    const { id } = req.params; // Course ID
    const { title, orderIndex } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO modules (course_id, title, order_index) VALUES ($1, $2, $3) RETURNING *',
            [id, title, orderIndex || 1]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createChapter = async (req, res) => {
    const { id } = req.params; // Module ID
    const { title, contentType, contentUrl, durationMinutes, content } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO chapters (module_id, title, content_type, content_url, duration_minutes, content) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, title, contentType, contentUrl, durationMinutes || 10, content || null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateModule = async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    try {
        const result = await db.query(
            'UPDATE modules SET title = $1 WHERE id = $2 RETURNING *',
            [title, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateChapter = async (req, res) => {
    const { id } = req.params;
    const { title, contentType, contentUrl, durationMinutes, content } = req.body;
    try {
        const result = await db.query(
            'UPDATE chapters SET title = COALESCE($1, title), content_type = COALESCE($2, content_type), content_url = COALESCE($3, content_url), duration_minutes = COALESCE($4, duration_minutes), content = COALESCE($5, content) WHERE id = $6 RETURNING *',
            [title, contentType, contentUrl, durationMinutes, content, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllQuizzes = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM quizzes ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateQuiz = async (req, res) => {
    const { id } = req.params;
    const { title, topic, questions } = req.body;
    try {
        // 1. Update Quiz Title & Topic
        await db.query('UPDATE quizzes SET title = $1, topic = $2, total_questions = $3 WHERE id = $4', [title, topic || 'General', questions.length, id]);
        
        // 2. Replace Questions (Simplest approach: Delete all, then insert new)
        await db.query('DELETE FROM quiz_questions WHERE quiz_id = $1', [id]);
        
        for (const q of questions) {
            await db.query(
                `INSERT INTO quiz_questions (quiz_id, question_text, options, correct_option) 
                 VALUES ($1, $2, $3, $4)`,
                [id, q.question, JSON.stringify(q.options), q.correct]
            );
        }

        res.json({ message: "Quiz Updated Successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.saveQuiz = async (req, res) => {
    const { title, topic, questions } = req.body; // questions = [{question, options, correct}]
    try {
        // 1. Create Quiz
        const quizResult = await db.query(
            'INSERT INTO quizzes (title, topic, total_questions) VALUES ($1, $2, $3) RETURNING *',
            [title, topic || 'General', questions.length]
        );
        const quizId = quizResult.rows[0].id; // ...

        // 2. Insert Questions
        for (const q of questions) {
            await db.query(
                `INSERT INTO quiz_questions (quiz_id, question_text, options, correct_option) 
                 VALUES ($1, $2, $3, $4)`,
                [quizId, q.question, JSON.stringify(q.options), q.correct]
            );
        }

        res.json({ id: quizId, message: "Quiz Saved" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getAssignmentsByTeacher = async (req, res) => {
    const { teacherId } = req.params;
    try {
        const result = await db.query(`
            SELECT a.*, c.name as class_name 
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            WHERE a.teacher_id = $1
            ORDER BY a.created_at DESC
        `, [teacherId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getClassesByTeacher = async (req, res) => {
    const { teacherId } = req.params;
    try {
        const result = await db.query(`
            SELECT c.* 
            FROM classes c
            JOIN teacher_classes tc ON c.id = tc.class_id
            WHERE tc.teacher_id = $1
        `, [teacherId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createStudent = async (req, res) => {
    const { name, email, classId } = req.body;
    try {
        // 1. Create User
        // Use a default hashed password (e.g., '123456' hashed or plain if strict auth not enforced here)
        // Ideally call Auth Service, but direct DB access for now
        const userResult = await db.query(
            "INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, 'student', '$2b$12$eX6lq.Z1.h1.u1.r1.p1.o1.u1.t1.e1.r1.s1.e1.c1.r1.e1.t1') RETURNING id",
            [name, email]
        );
        const userId = userResult.rows[0].id;

        // 2. Create Student
        const studentResult = await db.query(
            "INSERT INTO students (user_id, class_id) VALUES ($1, $2) RETURNING id",
            [userId, classId]
        );
        const studentId = studentResult.rows[0].id;

        // 3. Create Default Profile
        await db.query(
            "INSERT INTO student_profiles (student_id, learning_style, personality_type, strengths, challenges, goals, risk_level) VALUES ($1, 'Visual', 'Introvert', 'Analysis', 'Time Management', 'Improve Grades', 'Standard')",
            [studentId]
        );

        res.json({ id: studentId, message: "Student Created successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
