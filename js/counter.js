function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        
        // Format the number with K+ if it's in thousands
        const formattedValue = currentValue >= 1000 ? 
            (currentValue / 1000).toFixed(0) + 'K+' : 
            currentValue + '+';
            
        element.textContent = formattedValue;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

document.addEventListener('DOMContentLoaded', () => {
    // Get the stat number elements
    const userCounter = document.querySelector('.stat-number[data-count="users"]');
    const countryCounter = document.querySelector('.stat-number[data-count="countries"]');
    
    // Animate from 0 to target values
    if (userCounter) {
        animateValue(userCounter, 0, 2000, 2000); // Animate to 2000 over 2 seconds
    }
    
    if (countryCounter) {
        animateValue(countryCounter, 0, 20, 1500); // Animate to 20 over 1.5 seconds
    }
});
