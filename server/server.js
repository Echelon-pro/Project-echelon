const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Express middleware first
app.use(cors());
app.use(express.json());

// Import routes and middleware
const projectRoutes = require('./routes/Projects');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const authMiddleware = require('./middleware/auth');

// Mount API routes
app.use('/api/projects', projectRoutes);
app.use('/api/auth', authRoutes);

// Mount user routes with auth middleware for protected endpoints
app.use('/api/users', userRoutes);

// Add auth middleware to protect specific user routes
app.use('/api/users/profile', authMiddleware);

app.use('/api/chat', chatRoutes);

// SPA route handler
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../home.html'));
});

// Serve static files
app.use(express.static(path.join(__dirname, '../')));
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));

// Catch-all route for SPA
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/socket.io/') || req.url.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../home.html'));
});

app.get('*', (req, res) => {
    if (req.url.startsWith('/socket.io/')) {
        return;
    }
    res.sendFile(path.join(__dirname, '../home.html'));
});

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5000",
        methods: ["GET", "POST"]
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected to chat', socket.id);

    // Send existing messages
    const ChatMessage = require('./models/ChatMessage');
    ChatMessage.find()
        .sort({ timestamp: -1 })
        .limit(50)
        .lean()
        .then(messages => {
            socket.emit('chat:history', messages.reverse());
        })
        .catch(error => {
            console.error('Error fetching chat history:', error);
            socket.emit('chat:error', { message: 'Error fetching chat history' });
        });

    // Handle new messages
    socket.on('chat:message', async (message) => {
        try {
            console.log('Received message:', message);
            
            // Save to database
            const chatMessage = new ChatMessage({
                userId: message.userId,
                username: message.username,
                text: message.text.trim(),
                timestamp: new Date()
            });
            await chatMessage.save();

            // Broadcast to all clients
            io.emit('chat:new_message', chatMessage);
        } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('chat:error', { message: 'Error processing message' });
        }
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected from chat:', socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000
})
    .then(() => {
        console.log('Connected to MongoDB');
        console.log('Database name:', mongoose.connection.name);
        console.log('Connection state:', mongoose.connection.readyState);
        console.log('Connection host:', mongoose.connection.host);
        
        // Test the connection by trying to find users
        const User = require('./models/User');
        return User.find().then(users => {
            console.log(`Found ${users.length} total users in the database`);
            console.log('Database collections:', mongoose.connection.collections);
            if (users.length > 0) {
                console.log('Sample user data:', {
                    username: users[0].username,
                    isVerified: users[0].isVerified,
                    dogeAmount: users[0].dogeAmount,
                    country: users[0].country
                });
            }
        });
    })
    .catch(error => {
        console.error('MongoDB connection error:', error);
        console.error('Connection string used:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
        process.exit(1);
    });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});