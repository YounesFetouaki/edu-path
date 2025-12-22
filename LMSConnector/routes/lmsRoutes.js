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
router.get('/quizzes', lmsController.getAllQuizzes); // NEW: Get All Quizzes
router.get('/quizzes/:id', lmsController.getQuiz); 
router.post('/quizzes', lmsController.saveQuiz); // NEW: Save Quiz
router.put('/quizzes/:id', lmsController.updateQuiz); // NEW: Update Quiz

// Content Management
router.post('/courses/:id/modules', lmsController.createModule);
router.post('/modules/:id/chapters', lmsController.createChapter);
router.put('/modules/:id', lmsController.updateModule);
router.put('/chapters/:id', lmsController.updateChapter);

router.post('/sync', lmsController.syncData);


module.exports = router;
