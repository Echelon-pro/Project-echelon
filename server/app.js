const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create main app
const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
    origin: ['http://localhost:5000', 'http://127.0.0.1:5000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Essential middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    next();
});

// Static files - serve specific directories
const staticPaths = {
    '/css': '../css',
    '/js': '../js',
    '/images': '../images',
    '/node_modules': '../node_modules',
    '/uploads': '../uploads'
};

// Mount static files first
Object.entries(staticPaths).forEach(([url, dir]) => {
    const fullPath = path.join(__dirname, dir);
    console.log(`Mounting static directory ${url} -> ${fullPath}`);
    app.use(url, express.static(fullPath));
});

// Import models
require('./models/User');
require('./models/ChatMessage');
require('./models/NewsletterSubscriber');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const newsletterRoutes = require('./routes/newsletter');
const newsletterController = require('./controllers/newsletterController');

// Create API router
const apiRouter = express.Router();

// API logging
apiRouter.use((req, res, next) => {
    console.log('[API Router]', req.method, req.path);
    next();
});

// API test endpoint
apiRouter.get('/test', (req, res) => {
    console.log('[API] Router test endpoint hit');
    res.set('Content-Type', 'application/json');
    res.json({ message: 'API is working (router)' });
});

// Mount API routes
console.log('Mounting API routes:');
console.log('- /api/v1/auth');
apiRouter.use('/v1/auth', authRoutes);
console.log('- /api/v1/users');
apiRouter.use('/v1/users', userRoutes);
console.log('- /api/v1/chat');
apiRouter.use('/v1/chat', chatRoutes);
console.log('- /api/v1/newsletter');
apiRouter.use('/v1/newsletter', newsletterRoutes);

// Newsletter route
app.post('/api/v1/newsletter/subscribe', newsletterController.subscribe);

// API 404 handler
apiRouter.use((req, res) => {
    console.log('[API] 404:', req.method, req.path);
    res.set('Content-Type', 'application/json');
    res.status(404).json({ 
        message: 'API endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Mount API router
console.log('Mounting API router at /api');
app.use('/api', apiRouter);

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log('[DEBUG]', req.method, req.path, 'Content-Type:', req.get('Content-Type'), 'Accept:', req.get('Accept'));
    next();
});

// Page routing
app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return next();
    }
    
    // Skip static files
    if (Object.keys(staticPaths).some(prefix => req.path.startsWith(prefix))) {
        return next();
    }
    
    // Map URLs to HTML files
    const pages = {
        '/': 'home.html',
        '/home': 'home.html',
        '/home.html': 'home.html',
        '/about': 'about.html',
        '/about.html': 'about.html',
        '/faq': 'faq.html',
        '/faq.html': 'faq.html',
        '/leaderboard': 'leaderboard.html',
        '/leaderboard.html': 'leaderboard.html',
        '/login': 'login.html',
        '/login.html': 'login.html',
        '/join': 'join.html',
        '/join.html': 'join.html',
        '/terms': 'terms.html',
        '/terms.html': 'terms.html',
        '/privacy': 'privacy.html',
        '/privacy.html': 'privacy.html'
    };
    
    // Get the page path without query parameters
    const pagePath = req.path.split('?')[0];
    
    // Find the corresponding HTML file
    const htmlFile = pages[pagePath];
    
    if (htmlFile) {
        console.log(`[Pages] Serving ${htmlFile} for ${req.path}`);
        res.sendFile(path.join(__dirname, '..', htmlFile));
    } else {
        console.log(`[Pages] Page not found: ${req.path}`);
        res.status(404).sendFile(path.join(__dirname, '..', '404.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack);
    
    // API errors should return JSON
    if (req.path.startsWith('/api/')) {
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
        return;
    }
    
    // Web app errors can return HTML
    res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res) => {
    console.log('[404]', req.method, req.path);
    
    // API 404s should return JSON
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            message: 'API endpoint not found',
            path: req.path
        });
        return;
    }
    
    // Web app 404s should serve the SPA
    res.sendFile(path.join(__dirname, '../404.html'));
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

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    allowEIO3: true
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
            console.log('Sending chat history:', messages.length, 'messages');
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
            
            if (!message.userId || !message.username || !message.text) {
                console.error('Invalid message format:', message);
                socket.emit('chat:error', { message: 'Invalid message format' });
                return;
            }
            
            // Save to database
            const chatMessage = new ChatMessage({
                userId: message.userId,
                username: message.username,
                text: message.text.trim(),
                timestamp: new Date()
            });
            
            console.log('Saving message:', chatMessage);
            await chatMessage.save();

            // Broadcast to all clients
            console.log('Broadcasting message to all clients');
            io.emit('chat:new_message', chatMessage);
        } catch (error) {
            console.error('Error handling chat message:', error);
            socket.emit('chat:error', { message: 'Error saving message' });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected from chat', socket.id);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
