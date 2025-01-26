document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get username from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('username');
        
        if (!username) {
            throw new Error('No username provided');
        }

        // Encode username for URL
        const encodedUsername = encodeURIComponent(username.trim());

        // Fetch DOGE price
        const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=dogecoin&vs_currencies=usd');
        const priceData = await priceResponse.json();
        const dogePrice = priceData.dogecoin.usd;

        const response = await fetch(`/api/users/${encodedUsername}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        
        const { success, user: userData } = await response.json();
        
        if (!success || !userData) {
            throw new Error('Invalid user data received');
        }

        function updateProfileDisplay(user) {
            // Update username and position
            const profileName = document.querySelector('.profile-name');
            if (profileName) {
                profileName.textContent = user.username;
                // Add country flag if available
                if (user.country) {
                    const flagSpan = document.createElement('span');
                    flagSpan.className = `fi fi-${user.country.toLowerCase()}`;
                    flagSpan.style.marginLeft = '10px';
                    profileName.appendChild(flagSpan);
                }
            }

            // Update rank display
            const rankDisplay = document.querySelector('.profile-rank');
            if (rankDisplay) {
                console.log('Updating rank display, rank value:', user.rank);
                if (typeof user.rank === 'number' && user.rank > 0) {
                    rankDisplay.textContent = `Currently in position #${user.rank}`;
                } else {
                    rankDisplay.textContent = 'Loading rank...';
                }
            }

            // Update DOGE amount and USD value
            const dogeAmount = document.querySelector('.doge-amount');
            const usdValue = document.querySelector('.usd-value');
            if (dogeAmount) dogeAmount.textContent = `${user.dogeAmount || 0} DOGE`;
            if (usdValue) {
                const usdAmount = (user.dogeAmount * dogePrice || 0);
                const formattedValue = new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                    useGrouping: true,
                }).format(usdAmount).replace('.', ',').replace(/,/g, function(match, offset) {
                    return offset === usdAmount.toString().indexOf('.') ? ',' : '.';
                });
                usdValue.textContent = `$${formattedValue}`;
            }

            // Update profile picture
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
                profileImage.src = user.profilePicture || 'images/Doge No Pic.png';
            }

            // Update profile avatar
            const profileAvatar = document.querySelector('.profile-avatar');
            if (profileAvatar) {
                profileAvatar.onerror = () => {
                    profileAvatar.src = '/images/no-pic.svg';
                };
                profileAvatar.src = user.avatar || '/images/no-pic.svg';
            }

            // Update other profile information
            const countryName = document.querySelector('.country-name');
            if (countryName && user.country) {
                try {
                    // Use Intl.DisplayNames to get the full country name
                    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
                    countryName.textContent = regionNames.of(user.country.toUpperCase());
                } catch (error) {
                    console.error('Error getting country name:', error);
                    countryName.textContent = user.country;
                }
            }

            const memberSince = document.querySelector('.member-since');
            if (memberSince && user.joinDate) {
                const date = new Date(user.joinDate);
                const month = date.toLocaleString('en-US', { month: 'long' }); // Force English month names
                const year = date.getFullYear();
                memberSince.textContent = `${month} ${year}`;
            }

            const bio = document.querySelector('.bio');
            if (bio) bio.textContent = user.bio || 'No bio provided';

            const link = document.querySelector('.link');
            if (link) {
                if (user.profileLink) {
                    const linkAnchor = document.createElement('a');
                    // Add https:// if not present
                    const url = user.profileLink.startsWith('http://') || user.profileLink.startsWith('https://')
                        ? user.profileLink
                        : `https://${user.profileLink}`;
                    linkAnchor.href = url;
                    linkAnchor.textContent = user.profileLink;
                    linkAnchor.target = '_blank';
                    linkAnchor.rel = 'noopener noreferrer'; // Add security best practice
                    link.innerHTML = '';
                    link.appendChild(linkAnchor);
                } else {
                    link.textContent = 'No link provided';
                }
            }

            const walletAddress = document.querySelector('.wallet-address');
            if (walletAddress) walletAddress.textContent = user.walletAddress || 'Not provided';
        }

        async function loadContributions(username) {
            try {
                console.log('Original username:', username);
                const encodedUsername = encodeURIComponent(username.trim());
                console.log('Encoded username:', encodedUsername);
                
                const response = await fetch(`/api/users/${encodedUsername}/contributions`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    console.error('Server response:', response.status, response.statusText);
                    const errorText = await response.text();
                    console.error('Error details:', errorText);
                    throw new Error(`Failed to fetch contributions: ${response.status}`);
                }

                const data = await response.json();
                console.log('Received contributions data:', data);
                
                const contributionsContainer = document.getElementById('contributionsBody');
                const noContributionsDiv = document.getElementById('noContributions');

                if (!data.success || !data.contributions || data.contributions.length === 0) {
                    contributionsContainer.innerHTML = '';
                    noContributionsDiv.classList.remove('hidden');
                    return;
                }

                noContributionsDiv.classList.add('hidden');
                contributionsContainer.innerHTML = data.contributions.map(contribution => {
                    // Add null checks for each field
                    const amount = contribution.amount || 0;
                    const usdValue = contribution.usdValueAtTime || 0;
                    const date = contribution.timestamp ? new Date(contribution.timestamp).toLocaleDateString() : 'N/A';
                    const hash = contribution.transactionHash || '';
                    const shortHash = hash ? `${hash.substring(0, 8)}...` : 'N/A';
                    
                    return `
                        <tr>
                            <td>${amount} DOGE</td>
                            <td>$${Number(usdValue).toFixed(2)}</td>
                            <td>${date}</td>
                            <td>
                                ${hash ? 
                                    `<a href="https://dogechain.info/tx/${hash}" 
                                        target="_blank" 
                                        rel="noopener noreferrer">
                                        ${shortHash}
                                    </a>` : 
                                    'N/A'
                                }
                            </td>
                        </tr>
                    `;
                }).join('');
            } catch (error) {
                console.error('Error loading contributions:', error);
                const contributionsContainer = document.getElementById('contributionsBody');
                if (contributionsContainer) {
                    contributionsContainer.innerHTML = '<tr><td colspan="4">Failed to load contributions</td></tr>';
                }
            }
        }

        updateProfileDisplay(userData);
        
        // Load user's contributions
        await loadContributions(encodedUsername);  

        // Update wallet address and copy functionality
        const walletContainer = document.querySelector('.wallet-container');
        const copyButton = document.querySelector('.copy-button');
        const walletAddress = document.querySelector('.wallet-address');
        
        if (walletContainer && walletAddress) {
            const address = userData.walletAddress || 'Not set';
            walletAddress.textContent = address;

            // Create feedback element if it doesn't exist
            let copyFeedback = document.querySelector('.copy-feedback');
            if (!copyFeedback) {
                copyFeedback = document.createElement('span');
                copyFeedback.className = 'copy-feedback';
                walletContainer.appendChild(copyFeedback);
            }

            const copyWalletAddress = async (e) => {
                e.stopPropagation();
                if (address !== 'Not set') {
                    try {
                        await navigator.clipboard.writeText(address);
                        const originalText = walletAddress.textContent;
                        copyFeedback.textContent = 'Copied!';
                        copyButton.style.display = 'none';
                        
                        setTimeout(() => {
                            copyFeedback.textContent = '';
                            copyButton.style.display = 'block';
                        }, 3000);
                    } catch (err) {
                        console.error('Failed to copy:', err);
                        copyFeedback.textContent = 'Failed to copy';
                    }
                }
            };

            copyButton.addEventListener('click', copyWalletAddress);
            walletAddress.addEventListener('click', copyWalletAddress);
        }

        // Update statistics
        const totalTransactionsElement = document.querySelector('.total-transactions');
        const highestAmountElement = document.querySelector('.highest-amount');
        const averageTransactionElement = document.querySelector('.average-transaction');
        const activeDaysElement = document.querySelector('.active-days');

        if (totalTransactionsElement) {
            totalTransactionsElement.textContent = userData.totalTransactions || '0';
        }
        if (highestAmountElement) {
            const highestAmount = typeof userData.highestAmount === 'number' ? userData.highestAmount : 0;
            highestAmountElement.textContent = `${highestAmount.toLocaleString()} DOGE`;
        }
        if (averageTransactionElement) {
            const averageTransaction = typeof userData.averageTransaction === 'number' ? userData.averageTransaction : 0;
            averageTransactionElement.textContent = `${averageTransaction.toLocaleString()} DOGE`;
        }
        if (activeDaysElement) {
            activeDaysElement.textContent = userData.activeDays || '0';
        }

    } catch (error) {
        console.error('Error:', error);
        const mainElement = document.querySelector('main');
        mainElement.innerHTML = `
            <div class="error-container">
                <h2>Error loading profile</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
});
