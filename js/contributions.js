// Function to format numbers in European style
function formatNumber(number, decimals = 2) {
    return number.toLocaleString('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Function to create contribution item HTML
function createContributionItem(contribution) {
    return `
        <tr class="contribution-item">
            <td class="contribution-amount">
                ${formatNumber(contribution.amount, 2)} DOGE
            </td>
            <td class="contribution-value">
                $${formatNumber(contribution.usdValueAtTime, 2)}
            </td>
            <td class="contribution-date">
                ${formatDate(contribution.timestamp)}
            </td>
            <td class="contribution-hash" title="${contribution.transactionHash}">
                ${contribution.transactionHash.substring(0, 8)}...
            </td>
        </tr>
    `;
}

// Function to load and display contributions
async function loadContributions(username = null, page = 1) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Not authenticated');
        }

        // Get current user's username if not provided
        if (!username) {
            throw new Error('Username is required');
        }

        const endpoint = `/api/contributions/user/${username}?page=${page}`;
        console.log('Loading contributions from:', endpoint);
            
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch contributions');
        }

        const data = await response.json();
        console.log('Contributions data:', data);

        if (!data.success) {
            throw new Error(data.message || 'Failed to load contributions');
        }

        const contributionsList = document.getElementById('contributionsList');
        if (!contributionsList) {
            throw new Error('Contributions list container not found');
        }

        if (data.contributions && data.contributions.length > 0) {
            const contributionsHtml = data.contributions
                .map(createContributionItem)
                .join('');

            if (page === 1) {
                contributionsList.innerHTML = contributionsHtml;
            } else {
                contributionsList.innerHTML += contributionsHtml;
            }

            // Handle pagination
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                if (data.pagination && data.pagination.hasMore) {
                    loadMoreBtn.style.display = 'block';
                    loadMoreBtn.onclick = () => loadContributions(username, page + 1);
                } else {
                    loadMoreBtn.style.display = 'none';
                }
            }
        } else {
            contributionsList.innerHTML = '<tr><td colspan="4" class="no-data">No contributions yet</td></tr>';
        }

        // Update total DOGE amount in header if it exists
        if (data.stats) {
            const dogeAmountElement = document.querySelector('.doge-amount');
            const usdValueElement = document.querySelector('.usd-value');
            
            if (dogeAmountElement) {
                dogeAmountElement.textContent = `${formatNumber(data.stats.totalAmount, 2)} DOGE`;
            }
            if (usdValueElement) {
                usdValueElement.textContent = `$${formatNumber(data.stats.totalUsdValue, 2)}`;
            }
        }
    } catch (error) {
        console.error('Error loading contributions:', error);
        const contributionsList = document.getElementById('contributionsList');
        if (contributionsList) {
            contributionsList.innerHTML = `<tr><td colspan="4" class="error">${error.message}</td></tr>`;
        }
    }
}

// Export functions for use in other files
export { loadContributions, formatNumber, formatDate };
