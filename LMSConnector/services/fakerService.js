// const { faker } = require('@faker-js/faker'); // Removed for ESM compatibility
const db = require('../config/db');

// Helper to get faker instance
const getFaker = async () => {
    const module = await import('@faker-js/faker');
    return module.faker;
};

const generateStudents = async (count = 50) => {
    const faker = await getFaker();
    const students = [];
    for (let i = 0; i < count; i++) {
        students.push([
            faker.person.firstName(),
            faker.person.lastName(),
            faker.internet.email(),
            faker.date.past({ years: 1 })
        ]);
    }
    // Bulk insert approach (simplified loop for now)
    for (const s of students) {
        await db.query(
            'INSERT INTO students (first_name, last_name, email, enrollment_date) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
            s
        );
    }
    console.log(`Generated ${count} students`);
};

const generateCourses = async () => {
    const courses = [
        { title: 'Introduction to Data Science', category: 'Data', credits: 4 },
        { title: 'Advanced Web Development', category: 'CS', credits: 5 },
        { title: 'Database Systems', category: 'CS', credits: 3 },
        { title: 'Machine Learning Basics', category: 'AI', credits: 4 }
    ];
    for (const c of courses) {
        await db.query(
            'INSERT INTO courses (title, category, credits) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [c.title, c.category, c.credits]
        );
    }
    console.log('Generated Courses');
};

const generateActivities = async () => {
    const faker = await getFaker();
    // Get course IDs
    const res = await db.query('SELECT course_id FROM courses');
    const courses = res.rows;

    for (const c of courses) {
        // Generate a few activites per course
        for (let i = 0; i < 5; i++) {
            await db.query(
                'INSERT INTO activities (course_id, title, type, max_score) VALUES ($1, $2, $3, $4)',
                [
                    c.course_id,
                    faker.lorem.words(3),
                    faker.helpers.arrayElement(['quiz', 'assignment', 'video']),
                    100
                ]
            );
        }
    }
    console.log('Generated Activities');
};

const generateLogs = async (logCount = 500) => {
    const faker = await getFaker();
    const sRes = await db.query('SELECT student_id FROM students');
    const students = sRes.rows;
    const aRes = await db.query('SELECT activity_id, max_score FROM activities');
    const activities = aRes.rows;

    if (students.length === 0 || activities.length === 0) return;

    for (let i = 0; i < logCount; i++) {
        const s = faker.helpers.arrayElement(students);
        const a = faker.helpers.arrayElement(activities);
        const action = faker.helpers.arrayElement(['view', 'submit', 'video_watch']);
        let score = 0;
        if (action === 'submit') {
            score = faker.number.float({ min: 0, max: a.max_score, precision: 0.1 });
        }

        await db.query(
            'INSERT INTO student_logs (student_id, activity_id, action, score, timestamp, duration_seconds) VALUES ($1, $2, $3, $4, $5, $6)',
            [
                s.student_id,
                a.activity_id,
                action,
                score,
                faker.date.recent({ days: 30 }),
                faker.number.int({ min: 10, max: 3600 })
            ]
        );
    }
    console.log(`Generated ${logCount} logs`);
};

module.exports = {
    generateData: async () => {
        await generateCourses();
        await generateStudents(50);
        await generateActivities();
        await generateLogs(1000);
        return { message: 'Data generation complete' };
    }
};
