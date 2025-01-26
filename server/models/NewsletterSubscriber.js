const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email']
    },
    subscribed_at: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
