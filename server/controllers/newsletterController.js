const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const axios = require('axios');

/**
 * Subscribe to newsletter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.subscribe = async (req, res) => {
    try {
        const { email, recaptchaResponse } = req.body;

        // Verify reCAPTCHA first
        const recaptchaVerification = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: recaptchaResponse
                }
            }
        );

        // If reCAPTCHA verification failed
        if (!recaptchaVerification.data.success) {
            return res.status(403).json({
                success: false,
                message: 'reCAPTCHA verification failed'
            });
        }

        // Check if email already exists
        const existingSubscriber = await NewsletterSubscriber.findOne({ email });
        if (existingSubscriber) {
            return res.status(409).json({
                success: false,
                message: 'This email is already subscribed'
            });
        }

        // Create new subscriber
        const subscriber = new NewsletterSubscriber({
            email,
            subscribedAt: new Date()
        });

        await subscriber.save();

        res.status(200).json({
            success: true,
            message: 'Successfully subscribed to newsletter'
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process subscription'
        });
    }
};
