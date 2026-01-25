const express = require('express');
const router = express.Router();
const controller = require('../controllers/cbcEntryController');


router.post('/', controller.createCbcEntry);
router.get('/', controller.getAllCbcEntries);
router.get('/grades', controller.getGrades);
router.get('/learning-areas/:grade', controller.getLearningAreasByGrade);
router.get('/strands/:grade/:learningArea', controller.getStrandsByLearningArea);
router.get('/substrands/:grade/:strand', controller.getSubstrandsByStrand);
router.get('/:id', controller.getCbcEntryById);
router.put('/:id', controller.updateCbcEntry);
router.delete('/:id', controller.deleteCbcEntry);

module.exports = router;
