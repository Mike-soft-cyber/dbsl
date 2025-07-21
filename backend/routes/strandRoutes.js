const express = require('express');
const router = express.Router();
const strandController = require('../controllers/strandController');

// GET strands by grade and learning area ID
router.get('/:grade/:learningAreaId', strandController.getStrandsByGradeAndLearningArea);

module.exports = router;
