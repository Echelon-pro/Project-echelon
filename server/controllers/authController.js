const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail, templates } = require('../services/email-service');
const crypto = require('crypto');

function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push(`Password must be at least ${minLength} characters long`);
    if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
    if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
    if (!hasNumber) errors.push('Password must contain at least one number');
    if (!hasSpecialChar) errors.push('Password must contain at least one special character');

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.errors.join('\n')
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            verificationToken,
            verificationExpires,
            isVerified: false
        });

        await user.save();

        // Send verification email
        try {
            const verificationUrl = `${process.env.WEBSITE_URL}/verify-email?token=${verificationToken}`;
            console.log('Generated verification URL:', verificationUrl);
            
            await sendEmail(
                email,
                templates.emailVerification(verificationUrl)
            );

            res.status(201).json({
                success: true,
                message: 'Account created successfully. Please check your email to verify your account.'
            });
        } catch (emailError) {
            // If email fails, delete the user and return error
            await User.deleteOne({ _id: user._id });
            console.error('Failed to send verification email:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please try again.'
            });
        }
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating account'
        });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        console.log('Verifying email with token:', token);

        const user = await User.findOne({
            verificationToken: token,
            verificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log('Invalid or expired token');
            return res.status(400).json({
                success: false,
                message: 'The verification link is invalid or has expired.'
            });
        }

        // Update user
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();
        console.log('User verified successfully:', user.email);

        // Create JWT token
        const jwtToken = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success with token and user data
        res.json({
            success: true,
            message: 'Email verified successfully',
            token: jwtToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Error during email verification:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during verification'
        });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        console.log('Resend verification attempt for:', email);

        const user = await User.findOne({ email: email.toLowerCase() });
        console.log('User found:', user ? 'yes' : 'no');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'This email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        user.verificationToken = verificationToken;
        user.verificationExpires = verificationExpires;
        await user.save();
        console.log('User updated with new verification token');

        // Send new verification email
        const verificationUrl = `${process.env.WEBSITE_URL}/verify-email?token=${verificationToken}`;
        console.log('Verification URL:', verificationUrl);
        
        await sendEmail(
            email,
            templates.emailVerification(verificationUrl)
        );

        console.log('Verification email sent successfully');
        res.json({
            success: true,
            message: 'Verification email has been resent'
        });

    } catch (error) {
        console.error('Error resending verification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend verification email'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('No user found with email:', email);
            return res.status(401).json({
                success: false,
                message: '<span style="color: #ff4444;">Invalid credentials</span>'
            });
        }

        if (!user.isVerified) {
            console.log('User is not verified:', email);
            return res.status(401).json({
                success: false,
                message: '<span style="color: #ff4444;">Please verify your email before logging in</span>'
            });
        }

        // Check password
        console.log('Stored hashed password:', user.password);
        console.log('Attempting to compare with provided password:', password);
        const isMatch = await user.comparePassword(password);
        console.log('Password match:', isMatch ? 'Yes' : 'No');

        if (!isMatch) {
            console.log('Password did not match for user:', email);
            return res.status(401).json({
                success: false,
                message: '<span style="color: #ff4444;">Invalid credentials</span>'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', email);
        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};
