const express = require('express');
const router = express.Router();
const { handleCallback } = require('../controllers/callbackController');

router.post('/mpesa/callback', handleCallback);

module.exports = router;
