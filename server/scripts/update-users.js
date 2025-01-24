require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const userUpdates = [
    {
        username: 'CryptoWhale',
        country: 'jp',
        walletAddress: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L'
    },
    {
        username: 'DogeKing',
        country: 'us',
        walletAddress: 'DJ2za5EkCpgX9yH1tVz8YYFGEkB6YM5w9C'
    },
    {
        username: 'MoonHolder',
        country: 'gb',
        walletAddress: 'DJYMxUFPsD9X8QX6jPDf1N2Vc5qQKL3rWN'
    },
    {
        username: 'CryptoNinja',
        country: 'cn',
        walletAddress: 'DNZ1xKGnBz5sBit8sE7SuQpXpgLJ3Z6WBd'
    },
    {
        username: 'DogeWarrior',
        country: 'kr',
        walletAddress: 'DPZ9qLkHLhfFtXVF6FdKqix1nRJ5AkVJur'
    },
    {
        username: 'BlockMaster',
        country: 'de',
        walletAddress: 'DRQj8KqKxPzs7kBYvqhX9XGqDmJrXQZP5Y'
    },
    {
        username: 'ShibaLover',
        country: 'ca',
        walletAddress: 'DSKpC8GxJ5cVNhqjiJGYaHmQr9qJVXZJrx'
    },
    {
        username: 'CoinCollector',
        country: 'au',
        walletAddress: 'DTVcYeQrvfzp7ZqJwzGfQ9Yrz5dKkQVNmk'
    },
    {
        username: 'DogeExplorer',
        country: 'br',
        walletAddress: 'DUWxqoY9wSkKKVcwdcQxvRNmVGrjrNXVMt'
    },
    {
        username: 'CryptoPioneer',
        country: 'in',
        walletAddress: 'DVZLCKvYo1QWs5QEZz9JX9EXyK1WGqJ8Zw'
    }
];

async function updateUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const update of userUpdates) {
            console.log(`Updating user: ${update.username}`);
            await User.findOneAndUpdate(
                { username: update.username },
                { 
                    country: update.country,
                    walletAddress: update.walletAddress
                },
                { new: true }
            );
        }

        console.log('All users updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating users:', error);
        process.exit(1);
    }
}

updateUsers();
