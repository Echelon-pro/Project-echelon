import auth from '/js/auth.js';
import { updateProgress } from '/js/progress.js';

// Sample user data for testing
// const users = [
//     {
//         username: 'CryptoWhale',
//         dogeAmount: 25000.50,
//         country: 'us',
//         walletAddress: '0x1234...5678',
//         lastActive: new Date(Date.now() - 3600000)
//     },
//     {
//         username: 'DogeKing',
//         dogeAmount: 18500.75,
//         country: 'uk',
//         walletAddress: '0x8765...4321',
//         lastActive: new Date(Date.now() - 7200000)
//     },
//     {
//         username: 'MoonHolder',
//         dogeAmount: 15000.25,
//         country: 'de',
//         walletAddress: '0x9876...1234',
//         lastActive: new Date(Date.now() - 1800000)
//     }
// ];

async function fetchUsers() {
    try {
        console.log('[Leaderboard] Fetching users...');
        const response = await fetch('/api/users');
        console.log('[Leaderboard] Response status:', response.status);
        const data = await response.json();
        console.log('[Leaderboard] API response:', data);
        
        if (data.success && Array.isArray(data.users)) {
            // Fetch contributions for each user
            const usersWithContributions = await Promise.all(data.users.map(async user => {
                try {
                    const contributionsResponse = await fetch(`/api/users/${encodeURIComponent(user.username)}/contributions`);
                    const contributionsData = await contributionsResponse.json();
                    
                    if (contributionsData.success && Array.isArray(contributionsData.contributions)) {
                        // Count number of contributions instead of summing amounts
                        const contributionsCount = contributionsData.contributions.length;
                        return {
                            ...user,
                            contributions: contributionsCount, // This will be the count of contributions
                            lastContribution: contributionsData.contributions[0]?.timestamp || user.joinDate || Date.now()
                        };
                    }
                    return user;
                } catch (error) {
                    console.error(`[Leaderboard] Error fetching contributions for ${user.username}:`, error);
                    return user;
                }
            }));

            // Sort by DOGE amount and join date
            const sortedUsers = usersWithContributions.sort((a, b) => {
                // First compare by DOGE amount
                const dogeComparison = (b.dogeAmount || 0) - (a.dogeAmount || 0);
                
                // If DOGE amounts are equal, compare by join date
                if (dogeComparison === 0) {
                    return new Date(a.joinDate) - new Date(b.joinDate);
                }
                
                return dogeComparison;
            });

            console.log(`[Leaderboard] Found ${sortedUsers.length} users with contributions`);
            return sortedUsers;
        }
        
        console.error('[Leaderboard] Invalid data format received:', data);
        return [];
    } catch (error) {
        console.error('[Leaderboard] Error fetching users:', error);
        return [];
    }
}

function updateLeaderboard(users, dogePrice = 0) {
    console.log('[Leaderboard] Updating leaderboard with', users.length, 'users');
    const tbody = document.querySelector('#leaderboard');
    if (!tbody) {
        console.error('[Leaderboard] Could not find tbody element');
        return;
    }
    
    // Create a document fragment to build the new table content
    const fragment = document.createDocumentFragment();
    
    if (users.length === 0) {
        console.log('[Leaderboard] No users to display');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" class="text-center">
                <div class="empty-state">
                    <p>No verified users yet!</p>
                    <p class="text-sm">Be the first to verify your email and appear on the leaderboard.</p>
                </div>
            </td>
        `;
        fragment.appendChild(row);
    } else {
        users.forEach((user, index) => {
            const row = document.createElement('tr');
            const walletDisplayText = user.walletAddress || 'Not Set';
            const dogeAmount = user.dogeAmount || 0;
            const usdValue = dogePrice > 0 ? (dogeAmount * dogePrice) : 0;
            const contributions = parseInt(user.contributions) || 0;
            
            // Format USD value with European format (dots for thousands, comma for decimal)
            const formattedUsdValue = usdValue.toLocaleString('de-DE', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }).replace(/\.(\d+)$/, ',$1'); // Ensure we always use comma for decimal

            // Format DOGE amount with European format
            const formattedDogeAmount = dogeAmount.toLocaleString('de-DE').replace(/\.(\d+)$/, ',$1');

            row.innerHTML = `
                <td>#${index + 1}</td>
                <td>
                    <div class="user-cell">
                        <span class="fi fi-${user.country?.toLowerCase() || 'xx'}"></span>
                        <a href="profile.html?username=${user.username}" class="username">${user.username}</a>
                    </div>
                </td>
                <td>${formattedDogeAmount}</td>
                <td>$${formattedUsdValue}</td>
                <td>${contributions}</td>
                <td class="time-ago">${getTimeAgo(user.lastContribution)}</td>
                <td><span class="wallet-address" data-wallet="${walletDisplayText}">${walletDisplayText}</span></td>
            `;
            fragment.appendChild(row);

            // Add click handler for wallet address
            const walletAddress = row.querySelector('.wallet-address');
            if (walletAddress && user.walletAddress) {
                walletAddress.addEventListener('click', async (event) => {
                    const element = event.currentTarget;
                    const originalText = element.dataset.wallet;
                    try {
                        await navigator.clipboard.writeText(originalText);
                        element.textContent = 'Copied!';
                        setTimeout(() => {
                            element.textContent = originalText;
                        }, 2000);
                    } catch (err) {
                        console.error('Failed to copy:', err);
                    }
                });
            }
        });
    }
    
    // Only update the DOM once all rows are ready
    requestAnimationFrame(() => {
        tbody.innerHTML = '';
        tbody.appendChild(fragment);
    });
}

function getTimeAgo(date) {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears}y ago`;
}

// Function to calculate total collected amount
function updateCollectedAmount(leaderboardData) {
    const totalCollected = leaderboardData.reduce((sum, entry) => sum + parseFloat(entry.dogeAmount), 0);
    document.getElementById('collected-amount').textContent = totalCollected.toLocaleString();
    updateProgress(totalCollected);
}

// Cache duration in milliseconds (1 minute)
const CACHE_DURATION = 60 * 1000;

async function fetchLeaderboardData(forceRefresh = false) {
    try {
        // Check cache first
        const cachedData = localStorage.getItem('leaderboardData');
        const cachedTimestamp = localStorage.getItem('leaderboardTimestamp');
        
        if (!forceRefresh && cachedData && cachedTimestamp) {
            const age = Date.now() - parseInt(cachedTimestamp);
            if (age < CACHE_DURATION) {
                console.log('Using cached leaderboard data');
                const data = JSON.parse(cachedData);
                updateCollectedAmount(data.users);
                updateLeaderboard(data.users);
                return;
            }
        }

        // Fetch fresh data if cache is expired or forced refresh
        const response = await fetch('/api/users');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.users)) {
            // Update cache
            localStorage.setItem('leaderboardData', JSON.stringify(data));
            localStorage.setItem('leaderboardTimestamp', Date.now().toString());
            
            // Update UI
            updateCollectedAmount(data.users);
            updateLeaderboard(data.users);
        }
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        
        // If fetch fails, try to use cached data as fallback
        const cachedData = localStorage.getItem('leaderboardData');
        if (cachedData) {
            console.log('Using cached data as fallback');
            const data = JSON.parse(cachedData);
            updateCollectedAmount(data.users);
            updateLeaderboard(data.users);
        }
    }
}

// Function to update price display
function updatePriceDisplay(price, change) {
    const priceElement = document.getElementById('dogePrice');
    const changeElement = document.getElementById('priceChange');
    
    if (priceElement) {
        priceElement.textContent = price.toFixed(4);
    }
    
    if (changeElement) {
        const changeText = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
        changeElement.textContent = `(${changeText})`;
        
        // Update color based on change
        changeElement.classList.remove('positive', 'negative');
        changeElement.classList.add(change >= 0 ? 'positive' : 'negative');
    }
}

// Function to update everything with new price
const updateWithPrice = async (price, priceChange = 0) => {
    const currentDogePrice = price;
    localStorage.setItem('dogePrice', price.toString());
    const users = await fetchUsers();
    updateLeaderboard(users, currentDogePrice);
    updatePriceDisplay(price, priceChange);
};

// Initialize leaderboard with real data
document.addEventListener('DOMContentLoaded', async () => {
    // Initial load using cache if available
    fetchLeaderboardData();
    
    // Refresh data periodically (every minute)
    setInterval(() => {
        fetchLeaderboardData(true);
    }, CACHE_DURATION);

    // Get the last known price from localStorage or default to 0
    let currentDogePrice = parseFloat(localStorage.getItem('dogePrice')) || 0;
    
    // Immediately fetch and update with initial price
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=DOGEUSDT');
        const data = await response.json();
        const initialPrice = parseFloat(data.price);
        if (initialPrice > 0) {
            await updateWithPrice(initialPrice);
        } else if (currentDogePrice > 0) {
            // Use cached price if API fails
            await updateWithPrice(currentDogePrice);
        }
    } catch (error) {
        console.error('Error fetching initial price:', error);
        if (currentDogePrice > 0) {
            // Use cached price if API fails
            await updateWithPrice(currentDogePrice);
        }
    }

    // Get initial users and update with current price
    const users = await fetchUsers();
    updateLeaderboard(users, currentDogePrice);
    
    // Set up WebSocket for real-time updates
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/dogeusdt@ticker');
    let lastUpdate = Date.now();
    
    ws.onmessage = async (event) => {
        const now = Date.now();
        if (now - lastUpdate > 5000) {
            const data = JSON.parse(event.data);
            const newPrice = parseFloat(data.c);
            const priceChange = parseFloat(data.P);
            
            if (newPrice > 0) {
                await updateWithPrice(newPrice, priceChange);
                lastUpdate = now;
            }
        }
    };

    // Handle WebSocket errors and reconnection
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed. Attempting to reconnect...');
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    };
});
