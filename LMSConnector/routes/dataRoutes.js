const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

router.post('/generate', dataController.generate);
router.post('/init-schema', dataController.initSchema);

module.exports = router;
