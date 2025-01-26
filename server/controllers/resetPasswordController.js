const User = require('../models/User');
const { sendEmail, templates } = require('../services/email-service');
const tokenService = require('../services/token-service');
const bcrypt = require('bcryptjs');

// Request password reset
exports.requestPasswordReset = async (req, res) => {
    try {
        console.log('Password reset requested for email:', req.body.email);
        const { email } = req.body;

        // Find user by email
        console.log('Looking up user in database...');
        const user = await User.findOne({ email });
        console.log('User found:', !!user);
        
        // Always return the same response regardless of whether the email exists
        // This prevents email enumeration attacks
        if (!user) {
            return res.json({
                success: true,
                message: 'If an account exists with this email, you will receive password reset instructions shortly.'
            });
        }

        // Generate reset token
        console.log('Generating reset token...');
        const token = tokenService.generateToken(user._id.toString());

        // Send reset email
        console.log('Sending reset email...');
        const emailResult = await sendEmail(
            email,
            templates.passwordReset,
            token
        );

        console.log('Email result:', emailResult);

        if (!emailResult.success) {
            console.error('Failed to send reset email:', emailResult.error);
            throw new Error('Failed to send reset email');
        }

        res.json({
            success: true,
            message: 'If an account exists with this email, you will receive password reset instructions shortly.'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request'
        });
    }
};

// Reset password with token
exports.confirmPasswordReset = async (req, res) => {
    try {
        console.log('Password reset confirmation requested');
        const { token, newPassword } = req.body;

        // Validate token
        console.log('Validating token...');
        const validation = tokenService.validateToken(token);
        if (!validation.valid) {
            console.log('Token validation failed:', validation.reason);
            return res.status(400).json({
                success: false,
                message: validation.reason === 'Token expired' 
                    ? 'Password reset link has expired. Please request a new one.'
                    : 'Invalid password reset link'
            });
        }

        // Hash new password
        console.log('Hashing new password...');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        console.log('Updating password in database...');
        await User.findByIdAndUpdate(validation.userId, {
            password: hashedPassword
        });

        // Remove used token
        console.log('Removing used token...');
        tokenService.removeToken(token);

        console.log('Password reset successful');
        res.json({
            success: true,
            message: 'Your password has been successfully reset'
        });
    } catch (error) {
        console.error('Password reset confirmation error:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: 'An error occurred while resetting your password'
        });
    }
};
