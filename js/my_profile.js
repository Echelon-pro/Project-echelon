// Handle profile display and updates
function updateProfileDisplay(user) {
    console.log('Updating profile display with:', user);
    
    // Update username and flag
    const usernameDisplay = document.querySelector('.profile-name');
    const emailDisplay = document.querySelector('.profile-email');
    const dogeAmountDisplay = document.querySelector('.doge-amount');
    const usdValueDisplay = document.querySelector('.usd-value');
    const linkDisplay = document.querySelector('.profile-link');
    const rankDisplay = document.querySelector('.profile-rank');
    
    if (usernameDisplay) {
        usernameDisplay.textContent = user.username || 'Unknown';
        // Clear existing flag if any
        const existingFlag = usernameDisplay.querySelector('span');
        if (existingFlag) {
            existingFlag.remove();
        }
        if (user.country) {
            const flagSpan = document.createElement('span');
            flagSpan.className = `fi fi-${user.country.toLowerCase()}`;
            flagSpan.style.marginLeft = '8px';
            usernameDisplay.appendChild(flagSpan);
        }
    }

    // Update DOGE amount and rank
    if (dogeAmountDisplay) {
        dogeAmountDisplay.textContent = `${user.dogeAmount || 0} DOGE`;
    }

    if (rankDisplay) {
        if (typeof user.rank === 'number' && user.rank > 0) {
            rankDisplay.textContent = `Currently in position #${user.rank}`;
        } else {
            rankDisplay.textContent = user.isVerified ? 'Calculating rank...' : 'Verify your account to get ranked';
        }
    }

    // Fetch current DOGE price and update USD value
    if (usdValueDisplay) {
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=dogecoin&vs_currencies=usd')
            .then(response => response.json())
            .then(data => {
                const dogePrice = data.dogecoin.usd;
                const usdValue = (user.dogeAmount || 0) * dogePrice;
                const formattedValue = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(usdValue);
                usdValueDisplay.textContent = formattedValue;
            })
            .catch(error => {
                console.error('Error fetching DOGE price:', error);
                usdValueDisplay.textContent = '$0.00';
            });
    }

    // Update form fields
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const countrySelect = document.getElementById('country');
    const walletInput = document.getElementById('wallet');
    const bioInput = document.getElementById('bio');
    const linkInput = document.getElementById('link');
    const avatarImg = document.querySelector('.profile-avatar');
    const avatarContainer = document.querySelector('.avatar-container');

    if (usernameInput) usernameInput.value = user.username || '';
    if (emailInput) emailInput.value = user.email || '';
    if (countrySelect) countrySelect.value = user.country || '';
    if (walletInput) walletInput.value = user.walletAddress || '';
    if (bioInput) bioInput.value = user.bio || '';
    if (linkInput) linkInput.value = user.profileLink || '';
    
    // Update avatar with loading state
    if (avatarImg) {
        // Create a new image to preload
        const tempImg = new Image();
        tempImg.onload = () => {
            avatarImg.src = tempImg.src;
        };
        tempImg.onerror = () => {
            avatarImg.src = 'images/Doge No Pic.png';
        };
        
        // Set the source after setting up handlers
        if (user.avatar) {
            tempImg.src = user.avatar.startsWith('http') ? user.avatar : 
                         user.avatar.startsWith('/') ? user.avatar : 
                         `/uploads/${user.avatar}`;
        } else {
            tempImg.src = 'images/Doge No Pic.png';
        }
    }

    // Disable avatar upload until edit mode
    if (avatarContainer) {
        avatarContainer.style.pointerEvents = 'none';
    }
}

// Function to populate country dropdown
function populateCountries() {
    const countrySelect = document.getElementById('country');
    if (!countrySelect) return;

    const countries = {
        'de': 'Germany',
        'us': 'United States',
        'gb': 'United Kingdom',
        'fr': 'France',
        'it': 'Italy',
        'es': 'Spain',
        'pt': 'Portugal',
        'nl': 'Netherlands',
        'be': 'Belgium',
        'ch': 'Switzerland',
        'at': 'Austria',
        'se': 'Sweden',
        'dk': 'Denmark',
        'no': 'Norway',
        'fi': 'Finland',
        'pl': 'Poland',
        'cz': 'Czech Republic',
        'gr': 'Greece',
        'ru': 'Russia',
        'jp': 'Japan',
        'kr': 'South Korea',
        'cn': 'China',
        'in': 'India',
        'br': 'Brazil',
        'ca': 'Canada',
        'au': 'Australia',
        'nz': 'New Zealand'
    };

    // Clear existing options
    countrySelect.innerHTML = '';

    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Select a country';
    countrySelect.appendChild(emptyOption);

    // Add country options - just text, no flags
    Object.entries(countries).forEach(([code, name]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        countrySelect.appendChild(option);
    });
}

// Function to load and display user contributions
async function loadContributions() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch('/api/users/my_profile/contributions', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
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

// Initialize profile page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Profile page loaded');
    
    // Get form and buttons
    const profileForm = document.getElementById('profileForm');
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.querySelector('.btn[data-action="save"]');
    const avatarContainer = document.querySelector('.avatar-container');
    const avatarInput = document.getElementById('avatarInput');

    // Add redirect for Improve Rank button
    const joinLeaderboardBtn = document.getElementById('joinLeaderboardBtn');
    if (joinLeaderboardBtn) {
        joinLeaderboardBtn.addEventListener('click', () => {
            window.location.href = '/join.html';
        });
    }

    // Populate countries dropdown
    populateCountries();

    // Load initial profile data
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch('/api/users/my_profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        if (data.success && data.user) {
            // Remove any loading indicators
            document.title = document.title.replace('Loading...', '');
            updateProfileDisplay(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Load user's contributions
            await loadContributions();
        } else {
            console.error('Failed to fetch profile data:', data);
        }
    } catch (error) {
        console.error('Error fetching profile data:', error);
    }

    // Handle edit button click
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            console.log('Edit button clicked');
            // Enable form fields
            const formInputs = profileForm.querySelectorAll('input, select, textarea');
            formInputs.forEach(input => input.disabled = false);

            // Enable avatar upload
            if (avatarContainer) {
                avatarContainer.style.pointerEvents = 'auto';
            }

            // Show save button
            editBtn.style.display = 'none';
            if (saveBtn) {
                saveBtn.style.display = 'inline-flex';
            }
        });
    }

    // Handle avatar container click
    if (avatarContainer && avatarInput) {
        avatarContainer.addEventListener('click', () => {
            // Only allow click if in edit mode
            if (avatarContainer.style.pointerEvents !== 'none') {
                avatarInput.click();
            }
        });
    }

    // Handle save button click
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            try {
                // Get the latest token
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Not authenticated');
                }

                // Get form data
                const updatedUser = {
                    username: document.getElementById('username').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    country: document.getElementById('country').value,
                    walletAddress: document.getElementById('wallet').value.trim(),
                    bio: document.getElementById('bio') ? document.getElementById('bio').value.trim() : '',
                    profileLink: document.getElementById('link') ? document.getElementById('link').value.trim() : ''
                };

                console.log('Sending update request with data:', updatedUser);

                // Send update request
                const response = await fetch('/api/users/my_profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedUser)
                });

                const data = await response.json();

                if (data.success) {
                    // Update the profile display with the new data
                    updateProfileDisplay(data.user);
                    // Update localStorage
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Disable form fields
                    const formInputs = profileForm.querySelectorAll('input, select, textarea');
                    formInputs.forEach(input => input.disabled = true);

                    // Disable avatar upload
                    if (avatarContainer) {
                        avatarContainer.style.pointerEvents = 'none';
                    }

                    // Hide save button, show edit button
                    saveBtn.style.display = 'none';
                    editBtn.style.display = 'inline-flex';

                    alert('Profile updated successfully!');
                } else {
                    throw new Error(data.message || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile: ' + error.message);
            }
        });
    }

    // Handle avatar upload
    if (avatarInput) {
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // Create FormData
                const formData = new FormData();
                formData.append('avatar', file);

                // Get token
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Not authenticated');

                // Upload to server
                const response = await fetch('/api/users/avatar', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to upload avatar');
                }
                
                // Update avatar preview
                const avatarImg = document.querySelector('.profile-avatar');
                if (avatarImg) {
                    const avatarPath = data.avatar;
                    avatarImg.src = avatarPath.startsWith('http') ? avatarPath : avatarPath.startsWith('/') ? avatarPath : `/uploads/${avatarPath}`;
                }

                // Update user data in localStorage
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    user.avatar = data.avatar;
                    localStorage.setItem('user', JSON.stringify(user));
                }

                alert('Avatar updated successfully!');
            } catch (error) {
                console.error('Error uploading avatar:', error);
                alert(error.message || 'Failed to upload avatar. Please try again.');
            }
        });
    }

    // Handle logout button click
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        });
    }

    // Load contributions
    loadContributions();
});

export { updateProfileDisplay, populateCountries, loadContributions };
