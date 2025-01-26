const express = require('express');
const router = express.Router();
const { getMessages, postMessage } = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Debug route to verify router is working
// router.get('/test', (req, res) => {
//     console.log('Chat test route hit');
//     res.json({ message: 'Chat router is working' });
// });

router.get('/messages', getMessages);
router.post('/messages', auth, postMessage);

module.exports = router;
