const express = require('express');
const router = express.Router();
const NewsletterSubscriber = require('../models/NewsletterSubscriber');

// Debug logging for all newsletter routes
router.use((req, res, next) => {
    console.log('[Newsletter] Route hit:', req.method, req.originalUrl);
    console.log('[Newsletter] Request headers:', {
        'content-type': req.get('content-type'),
        'accept': req.get('accept')
    });
    console.log('[Newsletter] Request body:', req.body);
    next();
});

router.post('/subscribe', async (req, res) => {
    try {
        console.log('[Newsletter] Processing subscription request');
        
        // Check content type
        const contentType = req.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.log('[Newsletter] Invalid content type:', contentType);
            return res.status(400).json({
                message: 'Content-Type must be application/json',
                received: contentType
            });
        }
        
        // Check request body
        if (!req.body || typeof req.body !== 'object') {
            console.log('[Newsletter] Invalid request body:', req.body);
            return res.status(400).json({
                message: 'Request body must be a JSON object',
                received: typeof req.body
            });
        }
        
        const { email } = req.body;
        
        // Check email presence
        if (!email) {
            console.log('[Newsletter] Missing email in request');
            return res.status(400).json({
                message: 'Email is required',
                received: req.body
            });
        }
        
        // Basic email validation
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!emailRegex.test(email)) {
            console.log('[Newsletter] Invalid email format:', email);
            return res.status(400).json({
                message: 'Invalid email format',
                received: email
            });
        }

        console.log('[Newsletter] Creating subscriber with email:', email);
        
        // Try to create new subscriber
        const subscriber = new NewsletterSubscriber({ email });
        await subscriber.save();
        
        console.log('[Newsletter] Subscription successful');
        res.status(200).json({
            message: 'Successfully subscribed to newsletter',
            email: email
        });
    } catch (error) {
        // Handle duplicate email error
        if (error.code === 11000) {
            console.log('[Newsletter] Duplicate email error:', error);
            return res.status(409).json({
                message: 'Email already subscribed',
                email: req.body.email
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            console.log('[Newsletter] Validation error:', error);
            return res.status(400).json({
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        
        // Handle other errors
        console.error('[Newsletter] Subscription error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Debug route to test if newsletter routes are mounted
router.get('/test', (req, res) => {
    console.log('[Newsletter] Test endpoint hit');
    res.json({
        message: 'Newsletter routes are working',
        path: req.originalUrl,
        method: req.method
    });
});

module.exports = router;
