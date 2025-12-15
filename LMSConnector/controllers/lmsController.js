const db = require('../config/db');

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
        const result = await db.query('SELECT * FROM assignments WHERE student_id = $1 ORDER BY due_date ASC', [studentId]);
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
    const { studentId, title, description, teacherId, dueDate } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO assignments (student_id, title, description, due_date, teacher_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [studentId, title, description, dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), teacherId]
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
            SELECT g.*, q.title as quiz_title, c.title as course_title 
            FROM grades g
            JOIN quizzes q ON g.quiz_id = q.id
            JOIN chapters ch ON q.chapter_id = ch.id
            JOIN modules m ON ch.module_id = m.id
            JOIN courses c ON m.course_id = c.id
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
        const { title, description, category, teacherId } = req.body;
        const result = await db.query(
            'INSERT INTO courses (title, description, category, teacher_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, description, category, teacherId || 1]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
