document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Password validation function
    function validatePassword() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }

        if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            return 'Password must contain both letters and numbers';
        }

        if (password !== confirmPassword) {
            return 'Passwords do not match';
        }

        return null;
    }

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate password
        const passwordError = validatePassword();
        if (passwordError) {
            alert(passwordError);
            return;
        }

        // Get form data
        const formData = {
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: passwordInput.value,
            dogeAmount: parseFloat(document.getElementById('initialInvestment').value) || 0
        };

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log('Server response:', data); // Debug log

            if (data.success) {
                // Store user data and token
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Show success message and redirect
                alert('Account created successfully! Redirecting to homepage...');
                window.location.href = '/';
            } else {
                // Show specific error message from server
                const errorMessage = data.message || data.error || 'Registration failed. Please try again.';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Server connection error. Please try again later.');
        }
    });

    // Real-time password validation feedback
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const hint = passwordInput.nextElementSibling;
        
        if (password.length < 8) {
            hint.style.color = 'var(--error-color)';
        } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            hint.style.color = 'var(--warning-color)';
        } else {
            hint.style.color = 'var(--success-color)';
        }
    });

    // Confirm password validation
    confirmPasswordInput.addEventListener('input', () => {
        if (confirmPasswordInput.value === passwordInput.value) {
            confirmPasswordInput.style.borderColor = 'var(--success-color)';
        } else {
            confirmPasswordInput.style.borderColor = 'var(--error-color)';
        }
    });
});
