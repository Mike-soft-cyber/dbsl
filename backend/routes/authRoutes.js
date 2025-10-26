const express = require('express');
const router = express.Router();
const user = require('../controllers/authController');

//app.use('/api/user')
router.post('/register', user.signup);
router.post('/login', user.login);
router.get('/verify-email', user.verifyEmail);
router.post('/resend-verification', user.resendVerify)

module.exports = router;