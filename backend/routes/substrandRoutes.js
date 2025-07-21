const express = require('express');
const router = express.Router();
const substrandController = require('../controllers/substrandController');

// GET substrands by strand ID
router.get('/:strandId', substrandController.getSubstrandsByStrand);

module.exports = router;
