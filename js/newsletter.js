document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('newsletterForm');
    const messageDiv = document.getElementById('subscribeMessage');
    const emailInput = document.getElementById('newsletterEmail');

    if (form && messageDiv && emailInput) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const submitButton = form.querySelector('button[type="submit"]');
            
            // Basic client-side validation
            const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
            if (!emailRegex.test(email)) {
                messageDiv.textContent = '✗ Please enter a valid email address';
                messageDiv.className = 'message-status error';
                return;
            }

            // Verify reCAPTCHA
            const recaptchaResponse = grecaptcha.getResponse();
            if (!recaptchaResponse) {
                messageDiv.textContent = '✗ Please complete the reCAPTCHA';
                messageDiv.className = 'message-status error';
                return;
            }
            
            try {
                // Disable form and show loading state
                submitButton.disabled = true;
                emailInput.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>&nbsp;&nbsp;Subscribing...';
                messageDiv.textContent = '';
                messageDiv.className = 'message-status';
                
                const url = '/api/v1/newsletter/subscribe';
                console.log('[Newsletter] Submitting to:', url);
                console.log('[Newsletter] Email:', email);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ 
                        email,
                        recaptchaResponse 
                    })
                });

                console.log('[Newsletter] Response status:', response.status);
                const contentType = response.headers.get('content-type');
                console.log('[Newsletter] Response content-type:', contentType);

                // Check for JSON response
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error(`Expected JSON response but got ${contentType}`);
                }

                const data = await response.json();
                console.log('[Newsletter] Response data:', data);

                if (response.ok) {
                    messageDiv.textContent = '✓ Successfully subscribed!';
                    messageDiv.className = 'message-status success';
                    form.reset();
                    grecaptcha.reset(); // Reset reCAPTCHA after successful submission
                } else {
                    // Handle specific error cases
                    let errorMessage = data.message || 'Something went wrong';
                    
                    switch (response.status) {
                        case 400:
                            errorMessage = 'Invalid email format. Please try again.';
                            break;
                        case 409:
                            errorMessage = 'This email is already subscribed.';
                            break;
                        case 403:
                            errorMessage = 'reCAPTCHA verification failed. Please try again.';
                            grecaptcha.reset();
                            break;
                        case 500:
                            errorMessage = 'Server error. Please try again later.';
                            break;
                    }
                    
                    messageDiv.textContent = `✗ ${errorMessage}`;
                    messageDiv.className = 'message-status error';
                }
            } catch (error) {
                console.error('[Newsletter] Subscription error:', error);
                messageDiv.textContent = '✗ Network error. Please check your connection and try again.';
                messageDiv.className = 'message-status error';
                grecaptcha.reset(); // Reset reCAPTCHA on error
            } finally {
                // Restore form state
                submitButton.disabled = false;
                emailInput.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-paper-plane"></i>&nbsp;&nbsp;Notify Me';
            }
        });

        // Add input validation
        emailInput.addEventListener('input', () => {
            const email = emailInput.value.trim();
            const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
            
            if (email && !emailRegex.test(email)) {
                messageDiv.textContent = 'Please enter a valid email address';
                messageDiv.className = 'message-status warning';
            } else {
                messageDiv.textContent = '';
                messageDiv.className = 'message-status';
            }
        });
    } else {
        console.error('[Newsletter] Required elements not found:', {
            form: !!form,
            messageDiv: !!messageDiv,
            emailInput: !!emailInput
        });
    }
});
