// Tier configuration
const TIERS = [
    {
        level: 1,
        name: "Young DOGE Graduation",
        target: 69000,
        emoji: "🎓"
    },
    {
        level: 2,
        name: "Rocket Engines Warming Up",
        target: 100000,
        emoji: "🚀"
    },
    {
        level: 3,
        name: "Blazing Through Stratosphere",
        target: 420000,
        emoji: "⭐"
    },
    {
        level: 4,
        name: "Moon Mission Completed",
        target: 1000000,
        emoji: "🌙"
    },
    {
        level: 5,
        name: "Mars Colony Established",
        target: 4200000,
        emoji: "🔴"
    },
    {
        level: 6,
        name: "Intergalactic DOGE Civilization",
        target: 10000000,
        emoji: "🌌"
    },
    {
        level: 7,
        name: "DOGE Singularity",
        target: 20000000,
        emoji: "🌟"
    }
];

class TierManager {
    constructor() {
        this.tiers = TIERS;
        this.currentCollected = 0;
    }

    // Find the current tier based on collected amount
    getCurrentTier() {
        for (let i = 0; i < this.tiers.length; i++) {
            if (this.currentCollected < this.tiers[i].target) {
                return this.tiers[i];
            }
        }
        return this.tiers[this.tiers.length - 1]; // Return max tier if exceeded all
    }

    // Calculate progress percentage for current tier
    calculateProgress(collected) {
        this.currentCollected = collected;
        const currentTier = this.getCurrentTier();
        
        // Calculate progress as percentage of current tier target
        const percentage = (collected / currentTier.target) * 100;

        return {
            percentage: Math.min(Math.max(percentage, 0), 100).toFixed(1),
            currentTier: currentTier,
            collected: collected.toLocaleString(),
            target: currentTier.target.toLocaleString()
        };
    }

    // Format number with K, M suffix
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

// Export for use in other files
export const tierManager = new TierManager();
