const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, resendVerification } = require('../controllers/authController');
const { requestPasswordReset, confirmPasswordReset } = require('../controllers/resetPasswordController');

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification-email', resendVerification);
router.post('/reset-password', requestPasswordReset);
router.post('/reset-password/confirm', confirmPasswordReset);

module.exports = router;
