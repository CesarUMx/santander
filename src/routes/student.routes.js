const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { validateGoogleToken } = require('../middlewares/auth.middleware');

router.get('/student/credentials', validateGoogleToken, studentController.getStudentInfo);

module.exports = router;