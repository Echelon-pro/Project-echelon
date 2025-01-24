const CryptoJS = require('crypto-js');

class TokenService {
    constructor() {
        this.tokens = new Map(); // Store tokens in memory (consider using Redis in production)
    }

    generateToken(userId) {
        // Generate a random token
        const token = CryptoJS.lib.WordArray.random(32).toString();
        
        // Store token with user ID and expiration
        this.tokens.set(token, {
            userId,
            expires: Date.now() + 3600000 // 1 hour expiration
        });

        return token;
    }

    validateToken(token) {
        const tokenData = this.tokens.get(token);
        
        if (!tokenData) {
            return { valid: false, reason: 'Token not found' };
        }

        if (Date.now() > tokenData.expires) {
            this.tokens.delete(token);
            return { valid: false, reason: 'Token expired' };
        }

        return { valid: true, userId: tokenData.userId };
    }

    removeToken(token) {
        this.tokens.delete(token);
    }

    // Clean up expired tokens periodically
    startCleanup() {
        setInterval(() => {
            for (const [token, data] of this.tokens.entries()) {
                if (Date.now() > data.expires) {
                    this.tokens.delete(token);
                }
            }
        }, 3600000); // Clean up every hour
    }
}

module.exports = new TokenService();
