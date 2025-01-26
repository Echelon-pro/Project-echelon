import { API_BASE_URL } from '../config.js';

export async function requestPasswordReset(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to send reset password email');
        }

        return {
            success: true,
            message: data.message || 'If an account exists with this email, you will receive password reset instructions shortly.'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'An error occurred while sending the reset password email'
        };
    }
}

export async function confirmPasswordReset(token, newPassword) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to reset password');
        }

        return {
            success: true,
            message: data.message || 'Your password has been successfully reset'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'An error occurred while resetting your password'
        };
    }
}
