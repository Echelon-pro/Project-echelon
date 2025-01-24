const ChatMessage = require('../models/ChatMessage');

exports.getMessages = async (req, res) => {
    try {
        const messages = await ChatMessage.find()
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();

        res.json(messages.reverse());
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ message: 'Error fetching chat messages' });
    }
};

exports.postMessage = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Message text is required' });
        }

        const message = new ChatMessage({
            userId: req.user.id,
            username: req.user.username,
            text: text.trim()
        });

        await message.save();
        res.status(201).json(message);
    } catch (error) {
        console.error('Error posting chat message:', error);
        res.status(500).json({ message: 'Error posting chat message' });
    }
};
