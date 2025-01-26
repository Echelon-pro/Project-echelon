const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Contribution = require('../models/Contribution');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// Debug logging for route registration
console.log('Registering user routes...');

// Get my profile
router.get('/my_profile', authMiddleware, async (req, res) => {
    console.log('GET /my_profile route hit');
    try {
        // Get user ID from JWT token
        const userId = req.user._id;
        console.log('Fetching profile for user:', userId);
        
        // Find user
        const user = await User.findOne({
            _id: userId,
            isVerified: true
        });
        if (!user) {
            console.log('User not found or not verified:', userId);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Calculate user's rank
        console.log('Calculating rank for user with DOGE amount:', user.dogeAmount, 'isVerified:', user.isVerified);
        let rank = 0;
        
        if (user.isVerified) {
            // Count users with more DOGE
            const usersWithMoreDoge = await User.countDocuments({
                isVerified: true,
                dogeAmount: { $gt: user.dogeAmount }
            });
            
            // Count users with same DOGE but earlier join date
            const usersWithSameDogeButEarlier = await User.countDocuments({
                isVerified: true,
                dogeAmount: user.dogeAmount,
                joinDate: { $lt: user.joinDate }
            });
            
            rank = usersWithMoreDoge + usersWithSameDogeButEarlier + 1;
        }
        console.log('Final calculated rank:', rank);

        // Return user data without sensitive information
        const userData = user.toObject();
        userData.rank = rank;
        delete userData.password;
        console.log('Final response data with rank:', JSON.stringify(userData, null, 2));
        
        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get my profile contributions
router.get('/my_profile/contributions', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('Fetching contributions for authenticated user:', userId);

        // Get contributions using the Contribution model
        const contributions = await Contribution
            .find({ 
                user: userId,
                status: 'confirmed'
            })
            .sort({ timestamp: -1 });

        console.log('Raw contributions:', contributions);

        if (!contributions || contributions.length === 0) {
            return res.json({
                success: true,
                contributions: []
            });
        }

        // Format contributions data
        const formattedContributions = contributions.map(contribution => ({
            amount: contribution.amount,
            usdValueAtTime: contribution.usdValueAtTime,
            timestamp: contribution.timestamp,
            transactionHash: contribution.transactionHash
        }));

        console.log('Final formatted contributions:', formattedContributions);

        // Return contributions data
        res.json({ 
            success: true, 
            contributions: formattedContributions
        });
    } catch (error) {
        console.error('Error fetching contributions:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get user contributions
router.get('/:username/contributions', async (req, res) => {
    try {
        const username = decodeURIComponent(req.params.username).toLowerCase().trim();
        console.log('Fetching contributions for user:', username);
        console.log('Raw username parameter:', req.params.username);
        
        // First find the user to get their ID
        const user = await User.findOne({ 
            username: username,
            isVerified: true 
        });
        
        if (!user) {
            console.log('User not found or not verified:', username);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found or not verified'
            });
        }

        console.log('Found user:', user._id);

        // Get contributions using the Contribution model
        const contributions = await Contribution
            .find({ 
                user: user._id,
                status: 'confirmed'
            })
            .sort({ timestamp: -1 });

        console.log('Raw contributions:', contributions);

        if (!contributions || contributions.length === 0) {
            return res.json({
                success: true,
                contributions: []
            });
        }

        // Format contributions data
        const formattedContributions = contributions.map(contribution => ({
            amount: contribution.amount,
            usdValueAtTime: contribution.usdValueAtTime,
            timestamp: contribution.timestamp,
            transactionHash: contribution.transactionHash
        }));

        console.log('Final formatted contributions:', formattedContributions);

        // Return contributions data
        res.json({ 
            success: true, 
            contributions: formattedContributions
        });
    } catch (error) {
        console.error('Error fetching contributions:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get user by username
router.get('/:username', async (req, res) => {
    try {
        console.log('Fetching user:', req.params.username);
        const user = await User.findOne({ 
            username: req.params.username,
            isVerified: true 
        });
        if (!user) {
            console.log('User not found or not verified:', req.params.username);
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Calculate user's rank
        console.log('Calculating rank for user with DOGE amount:', user.dogeAmount, 'isVerified:', user.isVerified);
        let rank = 0;
        
        if (user.isVerified) {
            // Count users with more DOGE
            const usersWithMoreDoge = await User.countDocuments({
                isVerified: true,
                dogeAmount: { $gt: user.dogeAmount }
            });
            
            // Count users with same DOGE but earlier join date
            const usersWithSameDogeButEarlier = await User.countDocuments({
                isVerified: true,
                dogeAmount: user.dogeAmount,
                joinDate: { $lt: user.joinDate }
            });
            
            rank = usersWithMoreDoge + usersWithSameDogeButEarlier + 1;
        }
        console.log('Final calculated rank:', rank);

        const userData = {
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            dogeAmount: user.dogeAmount,
            country: user.country,
            bio: user.bio,
            walletAddress: user.walletAddress,
            profileLink: user.profileLink,
            joinDate: user.joinDate,
            rank: rank
        };

        console.log('Sending user data:', userData);
        res.json({ success: true, user: userData });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update my profile
router.put('/my_profile', authMiddleware, async (req, res) => {
    console.log('PUT /my_profile route hit');
    try {
        // Get user ID from JWT token
        const userId = req.user._id;
        console.log('Updating profile for user:', userId);
        console.log('Raw update data:', req.body);
        
        // Get update fields from request body
        const { username, email, country, bio, avatar, walletAddress, profileLink } = req.body;
        console.log('Extracted profileLink value:', profileLink);
        
        // Find user and update with $set operator
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('Found user:', JSON.stringify(user.toObject(), null, 2));

        // Check for duplicate username/email before updating
        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ 
                username: username.toLowerCase(),
                _id: { $ne: userId }
            });
            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
        }

        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ 
                email: email.toLowerCase(),
                _id: { $ne: userId }
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
        }

        if (walletAddress && walletAddress !== user.walletAddress) {
            const existingWallet = await User.findOne({ 
                walletAddress,
                _id: { $ne: userId }
            });
            if (existingWallet) {
                return res.status(400).json({
                    success: false,
                    message: 'Wallet address already registered'
                });
            }
        }

        // Validate required fields
        if (!username || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username and email are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate bio length
        if (bio && bio.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Bio must be less than 500 characters'
            });
        }
        
        // Create update object with $set
        const updateData = {};
        if (username) updateData.username = username.toLowerCase();
        if (email) updateData.email = email.toLowerCase();
        if (country) updateData.country = country;
        if (bio) updateData.bio = bio;
        if (walletAddress) updateData.walletAddress = walletAddress;
        if (typeof profileLink !== 'undefined') {
            console.log('Setting profileLink value:', profileLink);
            updateData.profileLink = profileLink;
        }
        if (avatar) updateData.avatar = avatar;

        console.log('Update data:', JSON.stringify(updateData, null, 2));

        // Use findByIdAndUpdate with $set
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        console.log('Updated user:', JSON.stringify(updatedUser.toObject(), null, 2));

        // Calculate user's rank
        console.log('Calculating rank for user with DOGE amount:', updatedUser.dogeAmount, 'isVerified:', updatedUser.isVerified);
        let rank = 0;
        
        if (updatedUser.isVerified) {
            // Count users with more DOGE
            const usersWithMoreDoge = await User.countDocuments({
                isVerified: true,
                dogeAmount: { $gt: updatedUser.dogeAmount }
            });
            
            // Count users with same DOGE but earlier join date
            const usersWithSameDogeButEarlier = await User.countDocuments({
                isVerified: true,
                dogeAmount: updatedUser.dogeAmount,
                joinDate: { $lt: updatedUser.joinDate }
            });
            
            rank = usersWithMoreDoge + usersWithSameDogeButEarlier + 1;
        }
        console.log('Final calculated rank:', rank);

        // Return updated user data
        const userData = updatedUser.toObject();
        userData.rank = rank;
        delete userData.password;
        userData.id = userData._id;
        
        console.log('Final response data:', JSON.stringify(userData, null, 2));
        return res.json({
            success: true,
            message: 'Profile updated successfully',
            user: userData
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update profile'
        });
    }
});

// Update user by ID
router.put('/:userId', async (req, res) => {
    try {
        // Get user ID from params and verify it matches the authenticated user
        const { userId } = req.params;
        if (userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this user'
            });
        }
        
        // Get update fields from request body
        const { username, email, country, bio, avatar, walletAddress, link } = req.body;
        console.log('Updating user:', userId, 'with data:', req.body);
        
        // Find user and update with $set operator
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('Found user:', JSON.stringify(user.toObject(), null, 2));

        // Check if username is being changed and is unique
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ 
                username: username.toLowerCase() 
            });
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Username is already taken'
                });
            }
        }

        // Check if email is being changed and is unique
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ 
                email: email.toLowerCase() 
            });
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already taken'
                });
            }
        }

        // Create update object with $set
        const updateData = {};
        if (username) updateData.username = username.toLowerCase();
        if (email) updateData.email = email.toLowerCase();
        if (country) updateData.country = country;
        if (bio) updateData.bio = bio;
        if (walletAddress) updateData.walletAddress = walletAddress;
        if (typeof link !== 'undefined') {
            console.log('Setting profileLink value:', link);
            updateData.profileLink = link;
        }
        if (avatar) updateData.avatar = avatar;

        console.log('Update data:', JSON.stringify(updateData, null, 2));

        // Use findByIdAndUpdate with $set
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        console.log('Updated user:', JSON.stringify(updatedUser.toObject(), null, 2));

        // Calculate user's rank
        console.log('Calculating rank for user with DOGE amount:', updatedUser.dogeAmount, 'isVerified:', updatedUser.isVerified);
        let rank = 0;
        
        if (updatedUser.isVerified) {
            // Count users with more DOGE
            const usersWithMoreDoge = await User.countDocuments({
                isVerified: true,
                dogeAmount: { $gt: updatedUser.dogeAmount }
            });
            
            // Count users with same DOGE but earlier join date
            const usersWithSameDogeButEarlier = await User.countDocuments({
                isVerified: true,
                dogeAmount: updatedUser.dogeAmount,
                joinDate: { $lt: updatedUser.joinDate }
            });
            
            rank = usersWithMoreDoge + usersWithSameDogeButEarlier + 1;
        }
        console.log('Final calculated rank:', rank);

        // Return updated user data
        const userData = updatedUser.toObject();
        userData.rank = rank;
        delete userData.password;
        
        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Avatar upload route
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Get user ID from JWT token
        const userId = req.user._id;
        
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete old avatar if it exists
        if (user.avatar && user.avatar !== '/images/default-avatar.png') {
            const oldAvatarPath = path.join(__dirname, '../..', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // Update user's avatar path
        const avatarPath = '/uploads/' + req.file.filename;
        user.avatar = avatarPath;
        await user.save();

        res.json({
            success: true,
            avatar: avatarPath
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload avatar'
        });
    }
});

// Get all users for leaderboard
router.get('/', async (req, res) => {
    console.log('[Users API] GET / - Fetching users for leaderboard');
    try {
        // Get verified users sorted by DOGE amount
        const query = { 
            isVerified: true,
            dogeAmount: { $gt: 0 }  // Only show users with DOGE
        };
        console.log('[Users API] Query:', JSON.stringify(query));
        
        const users = await User.find(query)
            .select('username country walletAddress dogeAmount joinDate')
            .sort({ dogeAmount: -1, joinDate: 1 })
            .limit(100);

        console.log(`[Users API] Found ${users.length} users`);
        console.log('[Users API] First user:', users[0] ? JSON.stringify(users[0]) : 'No users found');
        
        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('[Users API] Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch users'
        });
    }
});

// Get all users for the leaderboard
router.get('/all', async (req, res) => {
    try {
        console.log('GET /api/users - Starting user fetch...');
        console.log('Current database:', mongoose.connection.name);

        // Log all users without any conditions first
        const allUsers = await User.find().lean();
        console.log('All users in database:', allUsers.map(u => ({
            username: u.username,
            isVerified: u.isVerified,
            dogeAmount: u.dogeAmount
        })));

        const query = { 
            isVerified: true,
            dogeAmount: { $exists: true, $gt: 0 }
        };
        console.log('Executing query:', JSON.stringify(query));

        const users = await User.find(query)
            .select('username dogeAmount country joinDate walletAddress -_id')
            .lean()
            .sort({ dogeAmount: -1, joinDate: 1 })
            .limit(100)
            .maxTimeMS(30000);
        
        console.log('Query results:', users);
        
        res.json({ 
            success: true, 
            users: users.map(user => ({
                ...user,
                dogeAmount: user.dogeAmount || 0,
                country: user.country || 'us',
                walletAddress: user.walletAddress || '0x...'
            }))
        });
    } catch (error) {
        console.error('Error in GET /api/users:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            query: { isVerified: true, dogeAmount: { $exists: true, $gt: 0 } }
        });
    }
});

// Create test user (temporary route for development)
router.post('/test/create', async (req, res) => {
    try {
        // Hash a default password
        const hashedPassword = await bcrypt.hash('testpass123', 10);
        
        // Create test user data
        const testUser = {
            username: 'DogeKing',
            email: 'dogeking@example.com',
            password: hashedPassword,
            dogeAmount: 50000,
            walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            country: 'us',
            bio: 'Doge to the moon! 🚀',
            joinDate: new Date('2023-01-15'),
            totalTransactions: 156,
            highestAmount: 5000,
            averageTransaction: 320.51,
            activeDays: 245
        };
        
        // Check if user already exists
        const existingUser = await User.findOne({ username: testUser.username });
        if (existingUser) {
            return res.json({ success: true, message: 'Test user already exists', user: existingUser });
        }
        
        // Create new user
        const user = await User.create(testUser);
        res.json({ success: true, message: 'Test user created', user });
    } catch (error) {
        console.error('Error creating test user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Log that routes are registered
console.log('User routes registered successfully');

module.exports = router;