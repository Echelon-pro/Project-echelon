import { tierManager } from './tiers.js';

function updateProgress(collected) {
    const progress = tierManager.calculateProgress(collected);
    
    // Update progress bar
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');
    if (progressBar) {
        progressBar.style.width = `${progress.percentage}%`;
    }
    if (progressText) {
        progressText.textContent = `${progress.percentage}%`;
    }

    // Update collected amount
    const collectedAmount = document.getElementById('collected-amount');
    if (collectedAmount) {
        collectedAmount.textContent = progress.collected;
    }

    // Update target info
    const targetLabel = document.getElementById('target-label');
    const targetAmount = document.getElementById('target-amount');
    if (targetLabel && targetAmount) {
        targetLabel.textContent = `Target - Tier ${progress.currentTier.level}`;
        targetAmount.textContent = progress.target;
    }
}

// Initial update
const collected = 30062; // Current collected amount
updateProgress(collected);

// Listen for DOM content loaded as well
document.addEventListener('DOMContentLoaded', () => {
    updateProgress(collected);
});

// Export for use in other files
export { updateProgress };
