const express = require('express');
const router = express.Router();
const multer = require('multer');
const emailPDFController = require('../controllers/emailPDFController');

// Configure multer for SendGrid webhook
const upload = multer();

// SendGrid Inbound Parse webhook endpoint
router.post('/incoming', upload.any(), emailPDFController.processIncomingEmail);

// Confirmation endpoints
router.get('/pending/:token', emailPDFController.getPendingEntry);
router.post('/confirm/:token', emailPDFController.confirmExtractedData);

module.exports = router;