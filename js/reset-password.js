import { requestPasswordReset } from './services/auth-service.js';
import { showNotification } from './utils/notifications.js';

console.log('Reset password script loaded'); // Debug log

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded'); // Debug log
    
    const resetForm = document.getElementById('resetPasswordForm');
    const resetError = document.getElementById('resetError');
    const emailInput = document.getElementById('email');
    const submitButton = resetForm.querySelector('button[type="submit"]');

    console.log('Form elements:', { // Debug log
        resetForm: !!resetForm,
        resetError: !!resetError,
        emailInput: !!emailInput,
        submitButton: !!submitButton
    });

    resetForm.addEventListener('submit', async (e) => {
        console.log('Form submitted'); // Debug log
        e.preventDefault();
        
        // Reset previous error
        resetError.textContent = '';
        
        // Disable form while processing
        submitButton.disabled = true;
        emailInput.disabled = true;
        
        // Show loading state
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>&nbsp;&nbsp;Sending...';

        try {
            console.log('Sending reset request for:', emailInput.value); // Debug log
            const result = await requestPasswordReset(emailInput.value);
            console.log('Reset request result:', result); // Debug log
            
            if (result.success) {
                // Show success notification
                showNotification(result.message, 'success');
                
                // Clear the form
                emailInput.value = '';
                
                // Add success message with additional instructions
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <p>Please check your email for instructions to reset your password.</p>
                    <p class="small">If you don't see the email in your inbox, please check your spam folder.</p>
                `;
                
                // Replace the form with the success message
                resetForm.style.display = 'none';
                resetForm.parentNode.insertBefore(successMessage, resetForm.nextSibling);
            } else {
                resetError.textContent = result.message;
                showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Reset password error:', error); // Debug log
            const errorMessage = 'An unexpected error occurred. Please try again later.';
            resetError.textContent = errorMessage;
            showNotification(errorMessage, 'error');
        } finally {
            // Restore button state
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            emailInput.disabled = false;
        }
    });
});
