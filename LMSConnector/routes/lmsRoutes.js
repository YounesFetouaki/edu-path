const express = require('express');
const router = express.Router();
const lmsController = require('../controllers/lmsController');

router.get('/courses', lmsController.getAllCourses);
router.get('/courses/:id', lmsController.getCourseDetails);
router.get('/courses/:id/structure', lmsController.getCourseStructure); // New
router.post('/courses', lmsController.createCourse); // NEW: Create Course

router.get('/assignments/:studentId', lmsController.getAssignments);
router.post('/assign', lmsController.assignTask);

router.get('/students', lmsController.getAllStudents);

// Grades
router.get('/grades/:studentId', lmsController.getGrades);
router.post('/grades', lmsController.submitGrade);
router.get('/quizzes/:id', lmsController.getQuiz); // New

module.exports = router;
