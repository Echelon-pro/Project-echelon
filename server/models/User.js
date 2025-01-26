const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationExpires: Date,
    avatar: {
        type: String,
        default: '/images/default-avatar.png'
    },
    dogeAmount: {
        type: Number,
        default: 0
    },
    walletAddress: {
        type: String,
        unique: true,
        sparse: true
    },
    country: {
        type: String,
        default: 'us'
    },
    bio: {
        type: String,
        default: '',
        maxLength: 500
    },
    profileLink: {
        type: String,
        default: ''
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    links: {
        type: [String],
        default: []
    },
    contributions: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contribution'
        }],
        default: []
    },
    contributionStats: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    rank: {
        type: Number,
        default: 0
    },
    totalDogeEarned: {
        type: Number,
        default: 0
    },
    totalDogeSpent: {
        type: Number,
        default: 0
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Add post-save hook for debugging
userSchema.post('save', function(doc) {
    console.log('Post-save middleware running');
    console.log('Saved document:', doc.toObject());
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);