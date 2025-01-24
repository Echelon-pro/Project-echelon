const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { User, Contribution } = require('../models/User'); 

// Get user's contributions
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const contributions = await Contribution.find({ user: userId, status: 'confirmed' })
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const stats = await Contribution.getUserStats(userId);

        res.json({
            success: true,
            contributions,
            stats,
            pagination: {
                page,
                limit,
                hasMore: contributions.length === limit
            }
        });
    } catch (error) {
        console.error('Error fetching contributions:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch contributions'
        });
    }
});

// Get public contribution stats for any user
router.get('/user/:username', authMiddleware, async (req, res) => {
    try {
        const { username } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get contributions
        const contributions = await Contribution.find({ 
            user: user._id, 
            status: 'confirmed' 
        })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

        // Get total stats
        const stats = await Contribution.aggregate([
            { 
                $match: { 
                    user: user._id,
                    status: 'confirmed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalUsdValue: { $sum: '$usdValueAtTime' }
                }
            }
        ]);

        // Get total count for pagination
        const totalContributions = await Contribution.countDocuments({ 
            user: user._id, 
            status: 'confirmed' 
        });

        res.json({
            success: true,
            contributions: contributions.map(c => ({
                amount: c.amount,
                usdValueAtTime: c.usdValueAtTime,
                timestamp: c.timestamp,
                transactionHash: c.transactionHash
            })),
            stats: stats[0] || { totalAmount: 0, totalUsdValue: 0 },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalContributions / limit),
                hasMore: skip + limit < totalContributions
            }
        });
    } catch (error) {
        console.error('Error fetching contributions:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch contributions'
        });
    }
});

// Add new contribution
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { amount, usdValueAtTime, dogePrice, transactionHash } = req.body;
        const userId = req.user._id;

        // Create new contribution
        const contribution = new Contribution({
            user: userId,
            amount,
            usdValueAtTime,
            dogePrice,
            transactionHash
        });

        await contribution.save();

        // Update user's contribution stats
        const stats = await Contribution.getUserStats(userId);
        await User.findByIdAndUpdate(userId, {
            $set: {
                contributionStats: {
                    totalContributions: stats.totalContributions,
                    totalAmount: stats.totalAmount,
                    totalUsdValue: stats.totalUsdValue,
                    firstContribution: stats.firstContribution,
                    lastContribution: stats.lastContribution
                }
            }
        });

        res.json({
            success: true,
            contribution,
            message: 'Contribution added successfully'
        });
    } catch (error) {
        console.error('Error adding contribution:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to add contribution'
        });
    }
});

// Update contribution status
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const contribution = await Contribution.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: { status } },
            { new: true }
        );

        if (!contribution) {
            return res.status(404).json({
                success: false,
                message: 'Contribution not found'
            });
        }

        // Update user stats if status changed to confirmed
        if (status === 'confirmed') {
            const stats = await Contribution.getUserStats(req.user._id);
            await User.findByIdAndUpdate(req.user._id, {
                $set: { contributionStats: stats }
            });
        }

        res.json({
            success: true,
            contribution
        });
    } catch (error) {
        console.error('Error updating contribution status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update contribution status'
        });
    }
});

module.exports = router;
