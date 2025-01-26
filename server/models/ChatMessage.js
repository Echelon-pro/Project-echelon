const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying of recent messages
chatMessageSchema.index({ timestamp: -1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
module.exports = ChatMessage;
