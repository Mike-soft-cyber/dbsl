const express = require('express');
const router = express.Router();
const { createLearningArea, getLearningAreasByGrade } = require('../controllers/learningAreaController');

// Create a new learning area
router.post('/', createLearningArea);

// Get learning areas by grade
router.get('/grade/:grade', getLearningAreasByGrade); // e.g. /api/learningareas/grade/Grade 5

module.exports = router;
