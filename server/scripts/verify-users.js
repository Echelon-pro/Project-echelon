require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function verifyUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Count total users first
        const totalUsers = await User.countDocuments();
        console.log(`Total users in database: ${totalUsers}`);

        // Count already verified users
        const alreadyVerified = await User.countDocuments({ isVerified: true });
        console.log(`Already verified users: ${alreadyVerified}`);

        // Update all users to be verified
        const result = await User.updateMany(
            {}, // match all users
            {
                $set: {
                    isVerified: true,
                    verificationToken: undefined,
                    verificationExpires: undefined
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} users to verified status`);
        process.exit(0);
    } catch (error) {
        console.error('Error verifying users:', error);
        process.exit(1);
    }
}

verifyUsers();
