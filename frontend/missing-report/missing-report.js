// Missing Report Page Handler
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('missingReportForm');
    const emailInput = document.getElementById('missingEmail');
    const submitBtn = document.getElementById('submitBtn');
    const statusDiv = document.getElementById('statusMessage');
    const emailErrorDiv = document.getElementById('emailError');

    let originalButtonText = submitBtn.textContent;

    function isValidEmail(email) {
        return /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email);
    }

    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }

    function hideError(element) {
        element.style.display = 'none';
    }

    function showStatus(type, message) {
        statusDiv.className = `status-message ${type}`;
        statusDiv.innerHTML = message;
        statusDiv.style.display = 'block';
    }

    function hideStatus() {
        statusDiv.style.display = 'none';
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Checking... 🔍';
            hideStatus();
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = originalButtonText;
        }
    }

    // Real-time email validation on input
    emailInput.addEventListener('input', () => {
        const email = emailInput.value.trim();
        hideError(emailErrorDiv);
        hideStatus();
        
        if (email && !isValidEmail(email)) {
            showError(emailErrorDiv, 'Please enter a valid email address (e.g., name@example.com)');
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        // Reset previous errors and status
        hideError(emailErrorDiv);
        hideStatus();
        
        // Validate email
        if (!email) {
            showError(emailErrorDiv, 'Please enter your email address.');
            return;
        }
        
        if (!isValidEmail(email)) {
            showError(emailErrorDiv, 'Please enter a valid email address (e.g., name@example.com)');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        showStatus('loading', '🔍 Looking for your payment records...');
        
        try {
            // Check if Supabase is available
            if (!window.supabaseClient) {
                throw new Error('Service temporarily unavailable. Please try again later.');
            }
            
            // Call Supabase Edge Function
            const { data, error } = await window.supabaseClient.functions.invoke('handle-missing-report', {
                body: { email }
            });
            
            if (error) {
                throw new Error(error.message);
            }
            
            if (!data.success) {
                showStatus('error', data.message || 'No payment found with that email address.');
                return;
            }
            
            // Success - email sent
            showStatus('success', `✅ A download link has been sent to ${email}. Please check your inbox (and spam folder).`);
            
            // Clear the email input after success
            emailInput.value = '';
            
        } catch (err) {
            console.error('Error:', err);
            showStatus('error', '❌ Something went wrong. Please try again or contact support.');
        } finally {
            setLoadingState(false);
        }
    });
});