const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

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

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected to chat');

    socket.on('join', (username) => {
        console.log(`${username} joined the chat`);
        // io.emit('userJoined', username); // Removed server-side join notification
    });

    socket.on('message', async (data) => {
        try {
            const { username, text } = data;
            const ChatMessage = require('./models/ChatMessage');
            const message = new ChatMessage({
                username,
                text,
                timestamp: new Date()
            });
            await message.save();
            io.emit('message', message);
        } catch (error) {
            console.error('Error saving chat message:', error);
            socket.emit('error', 'Failed to save message');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from chat');
    });
});

// Serve static files
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));
app.use(express.static(path.join(__dirname, '../')));

// SPA route handler
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../home.html'));
});

// Catch-all route for SPA
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/socket.io/') || req.url.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../home.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
});

// Connect to MongoDB
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