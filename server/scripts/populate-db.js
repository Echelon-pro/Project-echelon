require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const users = [
    {
        username: 'CryptoWhale',
        email: 'cryptowhale@example.com',
        password: 'WhalePass123!',
        dogeAmount: 2458.32,
        country: 'jp', // Japan
        walletAddress: generateRandomWallet()
    },
    {
        username: 'DogeKing',
        email: 'dogeking@example.com',
        password: 'KingDoge456!',
        dogeAmount: 1876.45,
        country: 'us', // USA
        walletAddress: generateRandomWallet()
    },
    {
        username: 'MoonHolder',
        email: 'moonholder@example.com',
        password: 'MoonHold789!',
        dogeAmount: 1654.89,
        country: 'gb', // UK
        walletAddress: generateRandomWallet()
    },
    {
        username: 'CryptoNinja',
        email: 'cryptoninja@example.com',
        password: 'NinjaPass321!',
        dogeAmount: 987.65,
        country: 'cn', // China
        walletAddress: generateRandomWallet()
    },
    {
        username: 'DogeWarrior',
        email: 'dogewarrior@example.com',
        password: 'Warrior567!',
        dogeAmount: 876.54,
        country: 'kr', // South Korea
        walletAddress: generateRandomWallet()
    },
    {
        username: 'BlockMaster',
        email: 'blockmaster@example.com',
        password: 'MasterBlock890!',
        dogeAmount: 654.32,
        country: 'de', // Germany
        walletAddress: generateRandomWallet()
    },
    {
        username: 'ShibaLover',
        email: 'shibalover@example.com',
        password: 'ShibaLove234!',
        dogeAmount: 543.21,
        country: 'ca', // Canada
        walletAddress: generateRandomWallet()
    },
    {
        username: 'CoinCollector',
        email: 'coincollector@example.com',
        password: 'Collect789!',
        dogeAmount: 432.10,
        country: 'au', // Australia
        walletAddress: generateRandomWallet()
    },
    {
        username: 'DogeExplorer',
        email: 'dogeexplorer@example.com',
        password: 'Explore456!',
        dogeAmount: 321.98,
        country: 'br', // Brazil
        walletAddress: generateRandomWallet()
    },
    {
        username: 'CryptoPioneer',
        email: 'cryptopioneer@example.com',
        password: 'Pioneer123!',
        dogeAmount: 234.56,
        country: 'in', // India
        walletAddress: generateRandomWallet()
    }
];

function generateRandomWallet() {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let wallet = 'D';
    for (let i = 0; i < 33; i++) {
        wallet += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return wallet;
}

async function populateDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Create new users
        for (const userData of users) {
            const user = new User({
                ...userData,
                isVerified: true, // Make sure users are verified
                joinDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random date within last 30 days
            });
            await user.save();
            console.log(`Created user: ${userData.username} with email: ${userData.email}`);
        }

        console.log('Database populated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error populating database:', error);
        process.exit(1);
    }
}

populateDatabase();
