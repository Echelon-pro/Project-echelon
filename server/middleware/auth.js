const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        console.log('Auth middleware called');
        
        // Get token from header
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('No valid auth header found');
            return res.status(401).json({ 
                success: false,
                message: 'No token, authorization denied' 
            });
        }

        const token = authHeader.split(' ')[1];
        console.log('Token extracted:', token ? token.substring(0, 20) + '...' : 'missing');

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET not found in environment');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);

        // Add user from payload
        const userId = decoded._id;
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            console.log('No user found for token');
            return res.status(401).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Attach user to request
        req.user = user;
        console.log('User attached to request:', {
            id: user._id,
            username: user.username,
            email: user.email
        });

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Token is invalid' 
        });
    }
};
