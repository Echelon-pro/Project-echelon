const express = require('express');
const router = express.Router();
const { sendEmail, templates } = require('../../services/email-service');
const tokenService = require('../../services/token-service');
const db = require('../../db');

// Initialize token cleanup
tokenService.startCleanup();

// Request password reset
router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        
        // Always return the same response regardless of whether the email exists
        // This prevents email enumeration attacks
        if (!user) {
            return res.json({
                success: true,
                message: 'If an account exists with this email, you will receive password reset instructions shortly.'
            });
        }

        // Generate reset token
        const token = tokenService.generateToken(user.id);

        // Send reset email
        const emailResult = await sendEmail(
            email,
            templates.passwordReset,
            token
        );

        if (!emailResult.success) {
            throw new Error('Failed to send reset email');
        }

        res.json({
            success: true,
            message: 'If an account exists with this email, you will receive password reset instructions shortly.'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request'
        });
    }
});

// Reset password with token
router.post('/reset-password/confirm', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Validate token
        const validation = tokenService.validateToken(token);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.reason === 'Token expired' 
                    ? 'Password reset link has expired. Please request a new one.'
                    : 'Invalid password reset link'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await db.run(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, validation.userId]
        );

        // Remove used token
        tokenService.removeToken(token);

        res.json({
            success: true,
            message: 'Your password has been successfully reset'
        });
    } catch (error) {
        console.error('Password reset confirmation error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while resetting your password'
        });
    }
});

module.exports = router;
