const express = require('express');
const router = express.Router();
const docDashboardController = require('../controllers/docDashboardController');

router.get('/', docDashboardController.getAllTeacherPurchases);
router.delete('/:id', docDashboardController.deleteDocumentPurchase);

module.exports = router;
