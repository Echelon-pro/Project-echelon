class AuthService {
    constructor() {
        console.log('AuthService initializing...');
        this.token = localStorage.getItem('token');
        this.API_BASE_URL = ''; // Empty for same-origin requests
        
        try {
            const userStr = localStorage.getItem('user');
            this.user = userStr ? JSON.parse(userStr) : null;
            console.log('Initial auth state:', {
                token: this.token ? 'present' : 'absent',
                user: this.user ? 'present' : 'absent'
            });
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            this.user = null;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }

    isAuthenticated() {
        const token = localStorage.getItem('token');
        const user = this.getUser();
        const isAuth = !!token && !!user;
        console.log('Auth check:', { isAuth, hasToken: !!token, hasUser: !!user });
        return isAuth;
    }

    getUser() {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            
            const user = JSON.parse(userStr);
            return {
                id: user._id,
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            };
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success && data.token && data.user) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                console.log('Login successful:', {
                    token: 'present',
                    user: this.user.username
                });
                
                return this.user;
            } else {
                throw new Error(data.message || "Login failed");
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    logout() {
        console.log('Logging out...');
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    updateAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }

    async register(username, email, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            
            // Handle email verification case
            if (data.message && data.message.includes('verify your account')) {
                return {
                    success: true,
                    message: data.message,
                    email: email
                };
            }
            
            if (data.success && data.token && data.user) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                console.log('Registration successful:', {
                    token: 'present',
                    user: this.user.username
                });
                
                return this.user;
            } else {
                throw new Error(data.message || "Registration failed");
            }
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
}

// Create and export a single instance
const auth = new AuthService();
export default auth;
