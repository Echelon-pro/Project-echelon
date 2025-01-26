import auth from './auth.js';

// Function to check if user is logged in
function isLoggedIn() {
    return auth.isAuthenticated();
}

// Function to get user email
function getUserEmail() {
    return auth.getUserEmail();
}

// Function to get user display name
function getUserDisplay() {
    const user = auth.getUser();
    return user ? user.username || user.email : '';
}

// Function to logout user
function logout() {
    auth.logout();
    updateNavigation();
    window.location.href = '/';
}

// Update navigation based on auth state
function updateNavigation() {
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    if (isLoggedIn()) {
        const user = auth.getUser();
        const userMenuHTML = `
            <div class="user-menu">
                <div class="user-menu-content">
                    <a href="/my_profile.html" class="user-menu-item">
                        <i class="fas fa-user"></i>
                        Profile
                    </a>
                    <a href="#" class="user-menu-item" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i>
                        Logout
                    </a>
                </div>
                <button class="user-menu-button">
                    ${user.username}
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
        `;
        navRight.innerHTML = userMenuHTML;

        // Add logout functionality
        const logoutButton = document.getElementById('logoutBtn');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }

        // Toggle user menu
        const userMenuButton = document.querySelector('.user-menu-button');
        const userMenuContent = document.querySelector('.user-menu-content');
        if (userMenuButton && userMenuContent) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from bubbling up
                userMenuContent.classList.toggle('show');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenuButton.contains(e.target) && !userMenuContent.contains(e.target)) {
                    userMenuContent.classList.remove('show');
                }
            });
        }
    } else {
        navRight.innerHTML = `
            <a href="login.html" class="btn-white login-btn"><i class="fas fa-sign-in-alt"></i>Login</a>
        `;
    }
}

// Mobile menu functionality
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const topNav = document.querySelector('.top-nav');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            topNav.classList.toggle('menu-active');
            
            // Toggle menu button appearance
            const spans = mobileMenuBtn.querySelectorAll('span');
            spans.forEach(span => span.classList.toggle('active'));

            // Close user menu when mobile menu is toggled
            const userMenuContent = document.querySelector('.user-menu-content');
            if (userMenuContent) {
                userMenuContent.classList.remove('show');
            }
        });
    }

    // Close mobile menu when clicking a nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            topNav.classList.remove('menu-active');
            const spans = document.querySelectorAll('.mobile-menu-btn span');
            spans.forEach(span => span.classList.remove('active'));
        });
    });
}

// Initialize navigation
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    setupMobileMenu();
});

export { updateNavigation, logout };
