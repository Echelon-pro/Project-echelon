const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.co.uk',  // Changed to UK domain
    port: 587,                 // Changed to alternative port 587
    secure: false,             // Must be false for STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    requireTLS: true,          // Require TLS
    debug: true               // Enable debug logs
});

// Verify connection configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('SMTP connection error:', error);
    } else {
        console.log('SMTP server is ready to send messages');
    }
});

// Email templates
const templates = {
    passwordReset: (token) => ({
        subject: 'Reset Your Password - Echelon',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Reset Your Password</h2>
                <p>You've requested to reset your password. Click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.WEBSITE_URL}/reset-password-confirm.html?token=${token}" 
                       style="background-color: #3B82F6; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    This is an automated email from Echelon. Please do not reply to this email.
                </p>
            </div>
        `
    }),
    emailVerification: (verificationUrl) => ({
        subject: 'Verify Your Email - Echelon',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to Echelon!</h2>
                <p>Thank you for creating an account. Please verify your email address to complete your registration:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl.replace('/verify-email?', '/verify-email.html?')}" 
                       style="background-color: #3B82F6; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    This link will expire in 24 hours. If you didn't create an account, please ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    This is an automated email from Echelon. Please do not reply to this email.
                </p>
            </div>
        `
    })
};

// Send email function with better error handling
async function sendEmail(to, template) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('Email configuration missing');
        throw new Error('Email service not properly configured');
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: template.subject,
        html: template.html
    };

    try {
        console.log('Attempting to send email to:', to);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Failed to send email:', error);
        // Log specific error details for debugging
        if (error.code === 'EAUTH') {
            console.error('Authentication failed. Check credentials.');
        } else if (error.code === 'ESOCKET') {
            console.error('Socket error. Check network connection.');
        }
        throw new Error('Failed to send email. Please try again later.');
    }
}

module.exports = {
    sendEmail,
    templates
};
