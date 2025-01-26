const express = require('express');
const router = express.Router();
const NewsletterSubscriber = require('../server/models/NewsletterSubscriber');

router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        // Basic email validation
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Try to create new subscriber
        const subscriber = new NewsletterSubscriber({ email });
        await subscriber.save();
        
        res.status(200).json({ message: 'Successfully subscribed to newsletter' });
    } catch (error) {
        // Handle duplicate email error
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Email already subscribed' });
        }
        
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
