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
            
            if (data.success && !data.multiple) {
                // Single report found - send email automatically
                statusMessage.innerHTML = 'Sending report to your email...';
                statusMessage.className = 'status-message info';
                
                try {
                    const { data: emailResult, error: emailError } = await window.supabaseClient.functions.invoke('send-report-email', {
                        body: {
                            to: email,
                            pdfUrl: data.report.pdf_url,
                            customerName: 'Valued Customer',
                            declarationId: data.report.id
                        }
                    });
                    
                    if (emailError) throw emailError;
                    
                    statusMessage.innerHTML = '✅ Report sent to your email! Please check your inbox (and spam folder).';
                    statusMessage.className = 'status-message success';
                    
                    // Optionally show download link as backup
                    statusMessage.innerHTML += `<br><small><a href="${data.report.pdf_url}" target="_blank">Click here to download directly if email doesn't arrive</a></small>`;
                    
                } catch (err) {
                    console.error('Email send failed:', err);
                    statusMessage.innerHTML = `⚠️ Could not send email. <a href="${data.report.pdf_url}" target="_blank">Click here to download your report</a>`;
                    statusMessage.className = 'status-message error';
                }
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