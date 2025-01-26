const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    usdValueAtTime: {
        type: Number,
        required: true,
        min: 0
    },
    dogePrice: {
        type: Number,
        required: true,
        min: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    transactionHash: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'failed'],
        default: 'pending'
    }
});

// Add index for faster queries
contributionSchema.index({ user: 1, timestamp: -1 });

// Virtual for USD value at current price
contributionSchema.virtual('currentUsdValue').get(function() {
    return this.amount * this._currentDogePrice || 0;
});

// Static method to get user's total contributions
contributionSchema.statics.getUserStats = async function(userId) {
    const stats = await this.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), status: 'confirmed' } },
        {
            $group: {
                _id: '$user',
                totalContributions: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                totalUsdValue: { $sum: '$usdValueAtTime' },
                firstContribution: { $min: '$timestamp' },
                lastContribution: { $max: '$timestamp' }
            }
        }
    ]);
    
    return stats[0] || {
        totalContributions: 0,
        totalAmount: 0,
        totalUsdValue: 0,
        firstContribution: null,
        lastContribution: null
    };
};

const Contribution = mongoose.model('Contribution', contributionSchema);
module.exports = Contribution;
