const express = require('express')
const router = express.Router();
const documentController = require('../controllers/documentController')

router.get('/document', documentController.getDocument);
router.get('/terms', documentController.getTerms);
router.get('/grades', documentController.getGrades)

module.exports = router;