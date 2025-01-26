require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Contribution = require('../models/Contribution');

// Connect to MongoDB Atlas using environment variable
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB Atlas successfully');
    seedContributions();
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

const generateRandomContribution = (userId, timestamp) => {
    const amount = Math.floor(Math.random() * 1000) + 100; // Random amount between 100-1100 DOGE
    const dogePrice = 0.3774; // Current DOGE price
    const usdValueAtTime = amount * dogePrice;
    
    return {
        user: userId,
        amount,
        usdValueAtTime,
        dogePrice,
        timestamp,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 40),
        status: 'confirmed'
    };
};

const seedContributions = async () => {
    try {
        console.log('Starting to seed contributions...');
        
        // Clear existing contributions
        await Contribution.deleteMany({});
        console.log('Cleared existing contributions');

        // Get all users
        const users = await User.find({});
        console.log(`Found ${users.length} users`);

        for (const user of users) {
            // Generate random number of contributions (2-6)
            const numContributions = Math.floor(Math.random() * 5) + 2;
            console.log(`Generating ${numContributions} contributions for user ${user.username}`);
            
            // Generate contributions with different timestamps
            const contributions = [];
            for (let i = 0; i < numContributions; i++) {
                // Generate timestamp within last 30 days
                const daysAgo = Math.floor(Math.random() * 30);
                const timestamp = new Date();
                timestamp.setDate(timestamp.getDate() - daysAgo);
                
                contributions.push(generateRandomContribution(user._id, timestamp));
            }

            // Save contributions
            await Contribution.insertMany(contributions);

            // Calculate and update user stats
            const stats = await Contribution.getUserStats(user._id);
            await User.findByIdAndUpdate(user._id, {
                $set: { 
                    contributionStats: stats,
                    dogeAmount: stats.totalAmount // Update user's total DOGE amount
                }
            });
            
            console.log(`Updated stats for user ${user.username}`);
        }

        console.log('Successfully seeded contributions!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding contributions:', error);
        process.exit(1);
    }
};
