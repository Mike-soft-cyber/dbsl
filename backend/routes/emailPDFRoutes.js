const express = require('express');
const router = express.Router();
const multer = require('multer');
const emailPDFController = require('../controllers/emailPDFController');


const upload = multer();


router.post('/incoming', upload.any(), emailPDFController.processIncomingEmail);


router.get('/pending/:token', emailPDFController.getPendingEntry);
router.post('/confirm/:token', emailPDFController.confirmExtractedData);

module.exports = router;