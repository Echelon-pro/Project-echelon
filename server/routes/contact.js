const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configure nodemailer with your email service
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Replace with your email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

router.post('/api/contact', async (req, res) => {
    try {
        const { email, message } = req.body;

        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.SUPPORT_EMAIL, // The email where you want to receive contact form messages
            subject: 'New Contact Form Submission',
            text: `From: ${email}\n\nMessage: ${message}`,
            html: `<p><strong>From:</strong> ${email}</p><p><strong>Message:</strong><br>${message}</p>`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ message: 'Failed to send message. Please try again later.' });
    }
});

module.exports = router;
