// Missing Report Page Handler
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('missingReportForm');
    const emailInput = document.getElementById('missingEmail');
    const submitBtn = document.getElementById('submitBtn');
    const statusDiv = document.getElementById('statusMessage');
    const emailErrorDiv = document.getElementById('emailError');

    let originalButtonText = submitBtn.textContent;
    let selectedReportIds = [];

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

    // Render multi-select UI for reports
    function renderReportSelection(reports) {
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        let html = `<div class="reports-selection-container">
            <div class="reports-selection-title">Select the reports you need:</div>
            <div class="reports-list">`;

        reports.forEach((report) => {
            const date = new Date(report.date).toLocaleDateString('en-AU', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const displayName = report.client_name || 'Tax Report';
            const yearInfo = report.tax_year ? ` (${report.tax_year})` : '';

            html += `
                <label class="report-item">
                    <input type="checkbox" name="reportSelect" value="${report.id}" data-pdf-url="${report.pdf_url}" class="report-checkbox">
                    <div class="report-info">
                        <div class="report-name">${escapeHtml(displayName)}${escapeHtml(yearInfo)}</div>
                        <div class="report-details">
                            <span class="report-amount">$${report.amount.toFixed(2)}</span>
                            <span class="report-date"> • ${date}</span>
                        </div>
                    </div>
                </label>
            `;
        });

        html += `</div>
            <div class="selection-actions">
                <button id="sendSelectedBtn" class="btn-send" disabled>Send Selected Reports (0)</button>
                <button id="cancelSelectionBtn" class="btn-cancel">← Go back</button>
            </div>
        </div>`;

        showStatus('info', html);

        const checkboxes = document.querySelectorAll('input[name="reportSelect"]');
        const sendBtn = document.getElementById('sendSelectedBtn');
        const cancelBtn = document.getElementById('cancelSelectionBtn');

        function updateSelectedCount() {
            const checked = document.querySelectorAll('input[name="reportSelect"]:checked');
            selectedReportIds = Array.from(checked).map(cb => parseInt(cb.value));
            if (sendBtn) {
                const count = selectedReportIds.length;
                sendBtn.textContent = count === 0 ? 'Send Selected Reports (0)' : `Send Selected Reports (${count})`;
                sendBtn.disabled = count === 0;
            }
        }

        checkboxes.forEach(cb => {
            cb.addEventListener('change', updateSelectedCount);
        });

        if (sendBtn) {
            sendBtn.addEventListener('click', async () => {
                if (selectedReportIds.length === 0) return;

                setLoadingState(true);
                showStatus('loading', 'Sending download links to your email...');

                try {
                    const email = emailInput.value.trim();
                    const { data, error } = await window.supabaseClient.functions.invoke('handle-missing-report', {
                        body: {
                            email: email,
                            selectedReportIds: selectedReportIds
                        }
                    });

                    if (error) throw new Error(error.message);

                    if (data.success) {
                        // ── MULTI-REPORT success block ──────────────────────────
                        let links = '';
                        data.reports.forEach((report) => {
                            const date = new Date(report.date).toLocaleDateString('en-AU');
                            links += `
                                <div style="margin: var(--space-2) 0;">
                                    <a href="${report.pdf_url}" target="_blank" class="download-link">
                                        Download report from ${date}
                                    </a>
                                </div>`;
                        });

                        showStatus('success', `
                            <div>
                                <span class="square-icon">✓</span>
                                <strong>Download link sent to ${email}</strong>
                            </div>
                            <small>Please check your inbox (or spam folder).</small>
                            <div class="success-divider">or</div>
                            <div class="download-section">
                                ${links}
                            </div>
                        `);
                        emailInput.value = '';

                    } else {
                        showStatus('error', data.message || 'Something went wrong. Please try again.');
                    }
                } catch (err) {
                    console.error('Error:', err);
                    showStatus('error', '❌ Something went wrong. Please try again or contact support.');
                } finally {
                    setLoadingState(false);
                }
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                hideStatus();
                emailInput.value = '';
                emailInput.focus();
            });
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
        
        hideError(emailErrorDiv);
        hideStatus();
        
        if (!email) {
            showError(emailErrorDiv, 'Please enter your email address.');
            return;
        }
        
        if (!isValidEmail(email)) {
            showError(emailErrorDiv, 'Please enter a valid email address (e.g., name@example.com)');
            return;
        }
        
        setLoadingState(true);
        showStatus('loading', '🔍 Looking for your payment records...');
        
        try {
            if (!window.supabaseClient) {
                throw new Error('Service temporarily unavailable. Please try again later.');
            }
            
            // First call - get list of reports
            const { data, error } = await window.supabaseClient.functions.invoke('handle-missing-report', {
                body: { email: email }
            });
            
            if (error) {
                throw new Error(error.message);
            }
            
            if (!data.success) {
                showStatus('error', data.message || 'No report found for this email address.');
                return;
            }
            
            // Handle single report (sent automatically by Edge Function)
            if (!data.multiple && data.report) {
                showStatus('success', `
                    <div>
                        <span class="square-icon">✓</span>
                        <strong>Download link sent to ${email}</strong>
                    </div>
                    <small>Please check your inbox (or spam folder).</small>
                    <div class="success-divider">or</div>
                    <div class="download-section">
                        <a href="${data.report.pdf_url}" target="_blank" class="download-link">Click here to download your report</a>
                    </div>
                `);
                emailInput.value = '';
                return;
            }
            
            // Handle multiple reports - show selection UI
            if (data.multiple && data.reports && data.reports.length > 0) {
                renderReportSelection(data.reports);
                return;
            }
            
            showStatus('error', 'No report found for this email address.');
            
        } catch (err) {
            console.error('Error:', err);
            showStatus('error', '❌ Something went wrong. Please try again or contact support.');
        } finally {
            setLoadingState(false);
        }
    });
});