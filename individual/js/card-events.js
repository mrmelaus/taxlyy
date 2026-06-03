// card-events.js
// ========================================
// Card event listeners
// ========================================

function attachCardEventListeners(cardId) {
    switch(cardId) {
        case 'welcome':
            const openLegal = document.getElementById('openLegal');
            const closeLegal = document.getElementById('closeLegal');
            const closeLegalBtn = document.getElementById('closeLegalBtn');
            const legalOverlay = document.getElementById('legalOverlay');

            if (openLegal) openLegal.onclick = (e) => {
                e.preventDefault();
                if (legalOverlay) legalOverlay.style.display = 'flex';
                if (typeof setModalOpen === 'function') setModalOpen(true);
            };

            const closeModal = () => {
                if (legalOverlay) legalOverlay.style.display = 'none';
                if (typeof setModalOpen === 'function') setModalOpen(false);
            };

            if (closeLegal) closeLegal.onclick = closeModal;

            if (closeLegalBtn) closeLegalBtn.onclick = () => {
                const consentCb = document.getElementById('consentCheckbox');
                if (consentCb) {
                    consentCb.checked = true;
                    if (consentCb.onchange) consentCb.onchange();
                }
                closeModal();
            };

            if (legalOverlay) legalOverlay.onclick = (e) => {
                if (e.target === legalOverlay) closeModal();
            };

            const consentCb = document.getElementById('consentCheckbox');
            const nextBtn = document.getElementById('nextBtn');
            if (consentCb && nextBtn) {
                nextBtn.disabled = !consentCb.checked;
                nextBtn.style.opacity = consentCb.checked ? '1' : '0.4';
                nextBtn.style.cursor = consentCb.checked ? 'pointer' : 'not-allowed';

                consentCb.onchange = () => {
                    nextBtn.disabled = !consentCb.checked;
                    nextBtn.style.opacity = consentCb.checked ? '1' : '0.4';
                    nextBtn.style.cursor = consentCb.checked ? 'pointer' : 'not-allowed';
                };
            }

            break;

        case 'personal':

            // ── Basic field listeners ──────────────────────────

            const nameEl = document.getElementById('fullName');
            const nameError = document.getElementById('fullNameError');
            if (nameEl) {
                nameEl.addEventListener('input', (e) => {
                    let val = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
                    e.target.value = val;
                    userData.fullName = val;
                    if (val.trim().length >= 2) {
                        nameEl.style.borderColor = 'var(--accent)';
                        if (nameError) nameError.style.display = 'none';
                    }
                });
                nameEl.addEventListener('blur', () => {
                    if ((userData.fullName || '').trim().length < 2) {
                        nameEl.style.borderColor = 'var(--error)';
                        if (nameError) nameError.style.display = 'block';
                    }
                });
            }

            // TFN field
            const tfnInput = document.getElementById('tfn');
            const tfnError = document.getElementById('tfnError');

            if (tfnInput) {
                // Set initial formatted value
                tfnInput.value = formatTfnDisplay(userData.tfn || '');
                
                // Focus: show raw digits for editing
                tfnInput.addEventListener('focus', () => {
                    tfnInput.value = getRawTfn(tfnInput.value);
                });
                
                // Input: real-time formatting and validation
                tfnInput.addEventListener('input', (e) => {
                    let raw = e.target.value.replace(/\D/g, '');
                    if (raw.length > 9) raw = raw.slice(0, 9);
                    userData.tfn = raw;
                    e.target.value = formatTfnDisplay(raw);
                    
                    // Real-time error display
                    if (raw.length === 9) {
                        if (tfnError) tfnError.style.display = 'none';
                        e.target.style.borderColor = 'var(--accent)';
                    } else if (raw.length > 0 && raw.length < 9) {
                        if (tfnError) tfnError.style.display = 'block';
                        e.target.style.borderColor = 'var(--error)';
                    } else {
                        if (tfnError) tfnError.style.display = 'none';
                        e.target.style.borderColor = '';
                    }
                });
                
                // Blur: final format and validation
                tfnInput.addEventListener('blur', () => {
                    const raw = getRawTfn(tfnInput.value);
                    tfnInput.value = formatTfnDisplay(raw);
                    userData.tfn = raw;
                    
                    if (raw.length !== 9 && raw.length > 0) {
                        if (tfnError) tfnError.style.display = 'block';
                        tfnInput.style.borderColor = 'var(--error)';
                    } else if (raw.length === 9) {
                        if (tfnError) tfnError.style.display = 'none';
                        tfnInput.style.borderColor = 'var(--accent)';
                    } else {
                        if (tfnError) tfnError.style.display = 'none';
                        tfnInput.style.borderColor = '';
                    }
                });
            }

            const dobInput = document.getElementById('dob');
            const dobError = document.getElementById('dobError');
            if (dobInput) {
                dobInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 8) value = value.slice(0, 8);
                    if (value.length >= 3) value = value.slice(0, 2) + '/' + value.slice(2);
                    if (value.length >= 6) value = value.slice(0, 5) + '/' + value.slice(5);
                    e.target.value = value;
                    userData.dob = value;
                    if (dobError) dobError.style.display = 'none';
                    e.target.style.borderColor = '';
                });
                dobInput.addEventListener('blur', (e) => {
                    if (!validateDOB(e.target.value)) {
                        if (dobError) dobError.style.display = 'block';
                        e.target.style.borderColor = 'var(--error)';
                    } else {
                        if (dobError) dobError.style.display = 'none';
                        e.target.style.borderColor = 'var(--accent)';
                    }
                });
            }

            const emailInput = document.getElementById('email');
            const emailError = document.getElementById('emailError');
            if (emailInput) {
                emailInput.addEventListener('input', (e) => {
                    userData.email = e.target.value.trim();
                    if (validateEmail(userData.email)) {
                        emailInput.style.borderColor = 'var(--accent)';
                        if (emailError) emailError.style.display = 'none';
                    } else {
                        emailInput.style.borderColor = '';
                        if (emailError) emailError.style.display = 'none';
                    }
                });
                emailInput.addEventListener('blur', () => {
                    if (!validateEmail(userData.email || '')) {
                        emailInput.style.borderColor = 'var(--error)';
                        if (emailError) emailError.style.display = 'block';
                    } else {
                        emailInput.style.borderColor = 'var(--accent)';
                        if (emailError) emailError.style.display = 'none';
                    }
                });
            }

            // ── Residency Q flow helpers ───────────────────────

            function clearGroupError(id) {
                // Clear both outer wrapper and inner group
                const outer = document.getElementById(id);
                if (outer) {
                    outer.style.border = '';
                    outer.style.borderRadius = '';
                    outer.style.padding = '';
                    outer.style.backgroundColor = '';
                }
                const inner = document.querySelector(`#${id} .tax-residency-group`);
                if (inner) {
                    inner.style.border = '';
                    inner.style.borderRadius = '';
                    inner.style.padding = '';
                    inner.style.backgroundColor = '';
                }
            }

            function updateVisaTypeBranches() {
                const v = userData.visaType;

                // Show/hide Q2
                const taxResidentGroup = document.getElementById('taxResidentGroup');
                if (taxResidentGroup) {
                    taxResidentGroup.style.display =
                        (v === 'temp_visa' || v === 'whm') ? 'block' : 'none';
                }

                // If citizen/PR — clear downstream and derive immediately
                if (v === 'citizen_pr') {
                    userData.isTaxResident = undefined;
                    userData.hasMedicareExemptCert = undefined;
                    userData.isNdaCountry = undefined;
                    const medicareCertGroup = document.getElementById('medicareCertGroup');
                    const ndaCountryGroup = document.getElementById('ndaCountryGroup');
                    if (medicareCertGroup) medicareCertGroup.style.display = 'none';
                    if (ndaCountryGroup) ndaCountryGroup.style.display = 'none';
                    userData.taxStatus = deriveTaxStatus(userData);
                    updateEstimateAndDisplay(userData);
                }

                // Update card highlights
                document.querySelectorAll('input[name="visaType"]').forEach(r => {
                    const card = r.closest('.tax-residency-card');
                    if (card) card.classList.toggle('selected', r.checked);
                });

                clearGroupError('visaTypeGroup');
            }

            function updateTaxResidentBranch() {
                const v = userData.visaType;
                const res = userData.isTaxResident;

                // Q3a: Medicare cert (temp_visa + resident)
                const medicareCertGroup = document.getElementById('medicareCertGroup');
                if (medicareCertGroup) {
                    medicareCertGroup.style.display =
                        (v === 'temp_visa' && res === true) ? 'block' : 'none';
                }

                // Q3b: NDA country (whm + resident)
                const ndaCountryGroup = document.getElementById('ndaCountryGroup');
                if (ndaCountryGroup) {
                    ndaCountryGroup.style.display =
                        (v === 'whm' && res === true) ? 'block' : 'none';
                }

                // Clear irrelevant downstream answers
                if (!(v === 'temp_visa' && res === true)) {
                    userData.hasMedicareExemptCert = undefined;
                }
                if (!(v === 'whm' && res === true)) {
                    userData.isNdaCountry = undefined;
                    const ndaWarnBox = document.getElementById('ndaWarnBox');
                    if (ndaWarnBox) ndaWarnBox.style.display = 'none';
                }

                // Update card highlights
                document.querySelectorAll('input[name="isTaxResident"]').forEach(r => {
                    const card = r.closest('.tax-residency-card');
                    if (card) card.classList.toggle('selected', r.checked);
                });

                clearGroupError('taxResidentGroup');
                userData.taxStatus = deriveTaxStatus(userData);
                updateEstimateAndDisplay(userData);
            }

            function updateMedicareCertBranch() {
                document.querySelectorAll('input[name="medicareCert"]').forEach(r => {
                    const card = r.closest('.tax-residency-card');
                    if (card) card.classList.toggle('selected', r.checked);
                });
                clearGroupError('medicareCertGroup');
                userData.taxStatus = deriveTaxStatus(userData);
                updateEstimateAndDisplay(userData);
            }

            function updateNdaCountryBranch() {
                const ndaWarnBox = document.getElementById('ndaWarnBox');
                if (ndaWarnBox) {
                    ndaWarnBox.style.display = userData.isNdaCountry === true ? 'flex' : 'none';
                }
                document.querySelectorAll('input[name="ndaCountry"]').forEach(r => {
                    const card = r.closest('.tax-residency-card');
                    if (card) card.classList.toggle('selected', r.checked);
                });
                clearGroupError('ndaCountryGroup');
                userData.taxStatus = deriveTaxStatus(userData);
                updateEstimateAndDisplay(userData);
            }

            // ── Attach Q1 listeners ────────────────────────────

            document.querySelectorAll('input[name="visaType"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    userData.visaType = radio.value;
                    updateVisaTypeBranches();
                });
            });

            // ── Attach Q2 listeners ────────────────────────────

            document.querySelectorAll('input[name="isTaxResident"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    userData.isTaxResident = radio.value === 'yes';
                    updateTaxResidentBranch();
                });
            });

            // ── Attach Q3a listeners ───────────────────────────

            document.querySelectorAll('input[name="medicareCert"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    userData.hasMedicareExemptCert = radio.value === 'yes';
                    updateMedicareCertBranch();
                });
            });

            // ── Attach Q3b listeners ───────────────────────────

            document.querySelectorAll('input[name="ndaCountry"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    userData.isNdaCountry = radio.value === 'yes';
                    updateNdaCountryBranch();
                });
            });

            // ── Restore state on re-render ─────────────────────
            // (handles language switch and back navigation)
            updateVisaTypeBranches();
            if (userData.visaType === 'temp_visa' || userData.visaType === 'whm') {
                updateTaxResidentBranch();
            }
            if (userData.visaType === 'temp_visa' && userData.isTaxResident === true) {
                updateMedicareCertBranch();
            }
            if (userData.visaType === 'whm' && userData.isTaxResident === true) {
                updateNdaCountryBranch();
            }

            break;

        case 'income':
            function renderEmployerList() {
                const container = document.getElementById('employersListContainer');
                if (!container) return;
                if (!userData.employers || userData.employers.length === 0) {
                    container.innerHTML = `<div class="employers-empty">${t('noEmployersYet')}</div>`;
                    return;
                }
                let html = '';
                userData.employers.forEach((emp, idx) => {
                    const isEditing = (emp._editing === true);
                    html += `
                        <div class="employer-card" data-idx="${idx}">
                            <div class="employer-header">
                                <div class="employer-name">${escapeHtml(emp.employerName || '')}</div>
                                <div class="employer-buttons">
                                    <button class="edit-btn" data-idx="${idx}">${t('edit')}</button>
                                    <button class="delete-btn" data-idx="${idx}">${t('delete')}</button>
                                </div>
                            </div>
                            ${emp.employerAbn ? `<div class="employer-abn">ABN ${escapeHtml(emp.employerAbn)}</div>` : ''}
                            ${isEditing ? `
                                <div class="employer-edit-form">
                                    <div class="edit-row">
                                        <div class="edit-field">
                                            <label>${t('grossIncomeYTD')}</label>
                                            <input type="number" class="edit-gross" value="${emp.grossIncome || 0}" step="any">
                                        </div>
                                        <div class="edit-field">
                                            <label>${t('taxWithheldYTD')}</label>
                                            <input type="number" class="edit-tax" value="${emp.taxWithheld || 0}" step="any">
                                        </div>
                                    </div>
                                    <div class="edit-actions">
                                        <button class="update-btn" data-idx="${idx}">${t('update')}</button>
                                        <button class="cancel-btn" data-idx="${idx}">${t('cancel')}</button>
                                    </div>
                                </div>
                            ` : `
                                <div class="employer-stats">
                                    <span>${t('grossIncomeYTD')}: <span class="stat-value">${formatCurrency(emp.grossIncome || 0)}</span></span>
                                    <span>${t('taxWithheldYTD')}: <span class="stat-value">${formatCurrency(emp.taxWithheld || 0)}</span></span>
                                </div>
                            `}
                        </div>
                    `;
                });
                container.innerHTML = html;

                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.idx);
                        userData.employers[idx]._editing = true;
                        renderEmployerList();
                    });
                });
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.idx);
                        userData.employers.splice(idx, 1);
                        updateTotals();
                        renderEmployerList();
                        if (typeof updateEstimateAndDisplay === 'function') updateEstimateAndDisplay(userData);
                    });
                });
                document.querySelectorAll('.update-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.idx);
                        const cardDiv = btn.closest('.employer-card');
                        const gross = parseFloat(cardDiv.querySelector('.edit-gross').value) || 0;
                        const tax = parseFloat(cardDiv.querySelector('.edit-tax').value) || 0;
                        userData.employers[idx].grossIncome = gross;
                        userData.employers[idx].taxWithheld = tax;
                        delete userData.employers[idx]._editing;
                        updateTotals();
                        renderEmployerList();
                        if (typeof updateEstimateAndDisplay === 'function') updateEstimateAndDisplay(userData);
                    });
                });
                document.querySelectorAll('.cancel-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.idx);
                        delete userData.employers[idx]._editing;
                        renderEmployerList();
                    });
                });
            }

            //drag to upload
            function setupUploadListeners() {
                const oldZone = document.getElementById('uploadZone');
                if (!oldZone || typeof processPayslip === 'undefined') return;

                // Clone to strip ALL old event listeners
                const uploadZone = oldZone.cloneNode(false);
                oldZone.parentNode.replaceChild(uploadZone, oldZone);

                // Rebuild zone HTML
                uploadZone.innerHTML = `
                    <div class="upload-drag-hint">Drag &amp; drop or click to upload (PDF, JPG, PNG)</div>
                    <input type="file" id="payslipInput" accept=".pdf,.jpg,.jpeg,.png" style="display:none">
                `;

                const payslipInput = document.getElementById('payslipInput');

                uploadZone.addEventListener('click', () => payslipInput.click());

                payslipInput.addEventListener('change', async () => {
                    const file = payslipInput.files[0];
                    if (!file) return;

                    payslipInput.value = '';

                    uploadZone.innerHTML = `
                        <div class="spinner"></div>
                        <div style="margin-top:1rem;">Processing payslip with AI...</div>
                        <small>This may take 5–10 seconds</small>
                    `;

                   
                    try {
                        await handleUpload(file);
                    } catch (error) {
                        console.error('Unexpected error:', error);
                    } finally {
                        setupUploadListeners();
                    }
                });
            }

            const lookupBtn = document.getElementById('lookupEmployerBtn');
            const searchInput = document.getElementById('employerSearchInput');
            const lookupStatus = document.getElementById('lookupStatus');

            if (lookupBtn && searchInput && typeof ABNLookup !== 'undefined') {
                lookupBtn.addEventListener('click', async () => {
                    const query = searchInput.value.trim();
                    if (!query) {
                        lookupStatus.textContent = 'Please enter an ABN or business name';
                        lookupStatus.style.color = 'var(--error)';
                        return;
                    }
                    lookupStatus.textContent = 'Searching...';
                    lookupStatus.style.color = 'var(--text-muted)';
                    const result = await ABNLookup.search(query);

                    if (result.success && !result.isList) {
                        const newEmployer = {
                            employerName: result.data.legalName,
                            employerAbn: result.data.abnFormatted,
                            grossIncome: 0,
                            taxWithheld: 0,
                            _editing: true
                        };
                        if (!userData.employers) userData.employers = [];
                        window.addOrUpdateEmployer(newEmployer);  
                        updateTotals();
                        renderEmployerList();
                        searchInput.value = '';
                        lookupStatus.textContent = `✓ Added: ${result.data.legalName}`;
                        lookupStatus.style.color = 'var(--accent)';
                        if (typeof updateEstimateAndDisplay === 'function') updateEstimateAndDisplay(userData);
                    } else if (result.success && result.isList) {
                        let listHtml = '<div style="margin-top: 8px; border: 1px solid var(--glass-border); border-radius: var(--radius-sm); overflow: hidden;">';
                        result.data.forEach(item => {
                            listHtml += `
                                <div class="abn-result-item"
                                    data-name="${escapeHtml(item.legalName)}"
                                    data-abn-formatted="${escapeHtml(item.abnFormatted)}"
                                    style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--glass-border); background: var(--glass-bg); transition: background 0.1s;">
                                    <strong>${escapeHtml(item.legalName)}</strong><br>
                                    <small>ABN: ${escapeHtml(item.abnFormatted)}</small>
                                </div>
                            `;
                        });
                        listHtml += '</div>';
                        lookupStatus.innerHTML = `Found ${result.data.length} matching businesses – click to select:${listHtml}`;
                        lookupStatus.style.color = 'var(--warning)';

                        document.querySelectorAll('.abn-result-item').forEach(el => {
                            el.addEventListener('click', () => {
                                const newEmployer = {
                                    employerName: el.dataset.name,
                                    employerAbn: el.dataset.abnFormatted,
                                    grossIncome: 0,
                                    taxWithheld: 0,
                                    _editing: true
                                };
                                if (!userData.employers) userData.employers = [];
                                window.addOrUpdateEmployer(newEmployer);  
                                updateTotals();
                                renderEmployerList();
                                searchInput.value = '';
                                lookupStatus.innerHTML = `✓ Added: ${el.dataset.name}`;
                                lookupStatus.style.color = 'var(--accent)';
                                if (typeof updateEstimateAndDisplay === 'function') updateEstimateAndDisplay(userData);
                            });
                        });
                    } else {
                        lookupStatus.textContent = result.error || 'Not found';
                        lookupStatus.style.color = 'var(--error)';
                    }
                });
            }

           if (!userData.otherIncome) {
                userData.otherIncome = { interest: 0, dividends: 0, otherDescription: '', otherAmount: 0 };
            }
            // Initialise new top-level income fields
            if (userData.frankingCredits === undefined) userData.frankingCredits = 0;
            if (userData.governmentPayments === undefined) userData.governmentPayments = 0;
            if (userData.govTaxWithheld === undefined) userData.govTaxWithheld = 0;
            if (userData.abnIncome === undefined) userData.abnIncome = 0;
            if (userData.abnExpenses === undefined) userData.abnExpenses = 0;
            if (userData.abnTaxWithheld === undefined) userData.abnTaxWithheld = 0;
            if (userData.capitalGains === undefined) userData.capitalGains = 0;
            if (userData.capitalLosses === undefined) userData.capitalLosses = 0;
            if (userData.priorYearCapitalLosses === undefined) userData.priorYearCapitalLosses = 0;
            if (userData.cgtDiscountApplies === undefined) userData.cgtDiscountApplies = false;

            function getAbnWarnings() {
                const abnNet = (userData.abnIncome || 0) - (userData.abnExpenses || 0);
                const warnings = [];
                if (userData.abnIncome > 0 && abnNet < 0) {
                    warnings.push({ type: 'warning', text: t('abnLossWarning') });
                }
                if ((userData.abnIncome || 0) > 75000) {
                    warnings.push({ type: 'warning', text: t('abnGstWarning') });
                }
                return warnings;
            }

            function getCgtWarnings() {
                const netGain = (userData.capitalGains || 0) - (userData.capitalLosses || 0) - (userData.priorYearCapitalLosses || 0);
                const warnings = [];
                if (netGain > 10000) {
                    warnings.push({ type: 'info', text: t('cgtLargeWarning') });
                }
                const status = getEffectiveTaxStatus(userData);
                if ((userData.capitalGains || 0) > 0 && userData.cgtDiscountApplies && status !== 'australian') {
                    warnings.push({ type: 'error', text: t('cgtDiscountNotEligible') });
                }
                return warnings;
            }

            function renderWarnings(warnings) {
                if (!warnings.length) return '';
                return warnings.map(w => `
                    <div class="warning-box ${w.type}" style="margin-top: var(--space-3);">
                        <span class="warning-box-icon">${w.type === 'info' ? 'ℹ️' : '⚠️'}</span>
                        <span class="warning-box-text">${w.text}</span>
                    </div>
                `).join('');
            }

            function renderOtherIncomeList() {
                const container = document.getElementById('otherIncomeList');
                if (!container) return;
                const oi = userData.otherIncome;

                // --- INTEREST ---
                const interestEditing = oi._editing === 'interest';
                const interestDisplay = (oi.interest || 0) === 0 ? t('notEntered') : formatCurrency(oi.interest);

                // --- DIVIDENDS + FRANKING ---
                const dividendsEditing = oi._editing === 'dividends';
                const dividendsDisplay = (oi.dividends || 0) === 0 && (userData.frankingCredits || 0) === 0
                    ? `<span><span class="stat-label">${t('amountLabel')}:</span> <span class="stat-value">${t('notEntered')}</span></span>`
                    : `
                        <span><span class="stat-label">${t('cashDividendsLabel')}:</span> <span class="stat-value">${formatCurrency(oi.dividends || 0)}</span></span>
                        <span><span class="stat-label">${t('frankingCreditsInputLabel')}:</span> <span class="stat-value">${formatCurrency(userData.frankingCredits || 0)}</span></span>
                        <span><span class="stat-label">${t('grossedUpLabel')}:</span> <span class="stat-value">${formatCurrency((oi.dividends || 0) + (userData.frankingCredits || 0))}</span></span>
                    `;
                // --- GOVERNMENT PAYMENTS ---
                const govEditing = oi._editing === 'gov';
                const govDisplay = (userData.governmentPayments || 0) === 0
                    ? `<span><span class="stat-label">${t('amountLabel')}:</span> <span class="stat-value">${t('notEntered')}</span></span>`
                    : `
                        <span><span class="stat-label">${t('governmentPaymentsInputLabel')}:</span> <span class="stat-value">${formatCurrency(userData.governmentPayments)}</span></span>
                        <span><span class="stat-label">${t('govTaxWithheldLabel')}:</span> <span class="stat-value">${formatCurrency(userData.govTaxWithheld || 0)}</span></span>
                    `;

                // --- ABN INCOME ---
                const abnEditing = oi._editing === 'abn';
                const abnNet = (userData.abnIncome || 0) - (userData.abnExpenses || 0);

                    //  Store original ABN values when entering edit mode
                    if (abnEditing && userData._abnIncomeBackup === undefined) {
                        userData._abnIncomeBackup = userData.abnIncome;
                        userData._abnExpensesBackup = userData.abnExpenses;
                        userData._abnTaxWithheldBackup = userData.abnTaxWithheld;
                    }
                const abnDisplay = (userData.abnIncome || 0) === 0
                    ? `<span><span class="stat-label">${t('amountLabel')}:</span> <span class="stat-value">${t('notEntered')}</span></span>`
                    : `
                        <span><span class="stat-label">${t('abnIncomeLabel')}:</span> <span class="stat-value">${formatCurrency(userData.abnIncome)}</span></span>
                        <span><span class="stat-label">${t('abnExpensesLabel')}:</span> <span class="stat-value">${formatCurrency(userData.abnExpenses || 0)}</span></span>
                        <span><span class="stat-label">${t('abnNetLabel')}:</span> <span class="stat-value" style="color:${abnNet >= 0 ? 'var(--accent)' : 'var(--error)'};">${formatCurrency(abnNet)}</span></span>
                        <span><span class="stat-label">${t('abnTaxWithheldLabel')}:</span> <span class="stat-value">${formatCurrency(userData.abnTaxWithheld || 0)}</span></span>
                    `;

                // --- CAPITAL GAINS ---
                const cgtEditing = oi._editing === 'cgt';
                const cgtNet = (userData.capitalGains || 0) - (userData.capitalLosses || 0) - (userData.priorYearCapitalLosses || 0);
                const cgtDisplay = (userData.capitalGains || 0) === 0
                    ? `<span><span class="stat-label">${t('amountLabel')}:</span> <span class="stat-value">${t('notEntered')}</span></span>`
                    : `
                        <span><span class="stat-label">${t('capitalGainsLabel')}:</span> <span class="stat-value">${formatCurrency(userData.capitalGains)}</span></span>
                        <span><span class="stat-label">${t('capitalLossesLabel')}:</span> <span class="stat-value">${formatCurrency(userData.capitalLosses || 0)}</span></span>
                        <span><span class="stat-label">${t('priorYearLossesLabel')}:</span> <span class="stat-value">${formatCurrency(userData.priorYearCapitalLosses || 0)}</span></span>
                        <span><span class="stat-label">${t('netGainLabel')}:</span> <span class="stat-value">${formatCurrency(Math.max(0, cgtNet))}</span></span>
                        <span><span class="stat-label">${t('cgtDiscountLabel')}:</span> <span class="stat-value">${userData.cgtDiscountApplies ? t('cgtDiscountYes') : t('cgtDiscountNo')}</span></span>
                    `;
                // --- OTHER ---
                const otherEditing = oi._editing === 'other';
                const otherDisplay = (oi.otherAmount || 0) === 0 ? t('notEntered') : formatCurrency(oi.otherAmount);

               container.innerHTML = `
                    <!-- INTEREST -->
                    <div class="income-category-card" data-category="interest">
                        <div class="category-header">
                            <div class="category-name">${t('interest')}</div>
                            <button class="category-edit-btn" data-category="interest">${t('edit')}</button>
                         </div>
                            ${!interestEditing ? `
                                <div class="category-stats">
                                    <div class="stat-row">
                                        <span class="stat-label">${t('interestReceived')}:</span>
                                        <span class="stat-value">${formatMoney(oi.interest || 0)}</span>
                                    </div>
                                </div>
                            ` : `
                            <div class="category-edit-form">
                                <div class="edit-field">
                                    <label>${t('amountLabel')}</label>
                                    <input type="number" class="edit-interest" value="${oi.interest || 0}" step="any" min="0">
                                </div>
                                <div class="edit-actions">
                                    <button class="update-btn" data-category="interest">${t('update')}</button>
                                    <button class="cancel-btn" data-category="interest">${t('cancel')}</button>
                                </div>
                            </div>
                        `}
                    </div>

                    <!-- DIVIDENDS + FRANKING -->
                    <div class="income-category-card" data-category="dividends">
                        <div class="category-header">
                            <div class="category-name">${t('dividends')}</div>
                            <button class="category-edit-btn" data-category="dividends">${t('edit')}</button>
                        </div>
                        ${!dividendsEditing ? `
                            <div class="category-stats column">
                                ${dividendsDisplay}
                            </div>
                        ` : `
                            <div class="category-edit-form">
                                <div class="edit-field">
                                    <label>${t('cashDividendsLabel')}</label>
                                    <input type="number" class="edit-dividends" value="${oi.dividends || 0}" step="any" min="0">
                                </div>
                                <div class="edit-field">
                                    <label>${t('frankingCreditsInputLabel')}</label>
                                    <input type="number" class="edit-franking" value="${userData.frankingCredits || 0}" step="any" min="0">
                                    <small class="form-note">${t('frankingCreditsHint')}</small>
                                </div>
                                <div class="edit-field">
                                    <label>${t('grossedUpLabel')}</label>
                                    <div class="calculated-value" id="grossedUpDisplay">${formatCurrency((oi.dividends || 0) + (userData.frankingCredits || 0))}</div>
                                </div>
                                <div class="edit-actions">
                                    <button class="update-btn" data-category="dividends">${t('update')}</button>
                                    <button class="cancel-btn" data-category="dividends">${t('cancel')}</button>
                                </div>
                            </div>
                        `}
                    </div>

                    <!-- GOVERNMENT PAYMENTS -->
                    <div class="income-category-card" data-category="gov">
                        <div class="category-header">
                            <div class="category-name">${t('governmentPayments')}</div>
                            <button class="category-edit-btn" data-category="gov">${t('edit')}</button>
                        </div>
                        ${!govEditing ? `
                            <div class="category-stats column">
                                ${govDisplay}
                            </div>
                            <div class="deduction-hint">${t('governmentPaymentsHint')}</div>
                        ` : `
                            <div class="category-edit-form">
                                <div class="edit-field">
                                    <label>${t('governmentPaymentsInputLabel')}</label>
                                    <input type="number" class="edit-gov-amount" value="${userData.governmentPayments || 0}" step="any" min="0">
                                    <small class="form-note">${t('governmentPaymentsHint')}</small>
                                </div>
                                <div class="edit-field">
                                    <label>${t('govTaxWithheldLabel')}</label>
                                    <input type="number" class="edit-gov-withheld" value="${userData.govTaxWithheld || 0}" step="any" min="0">
                                    <small class="form-note">${t('govTaxWithheldHint')}</small>
                                </div>
                                <div class="edit-actions">
                                    <button class="update-btn" data-category="gov">${t('update')}</button>
                                    <button class="cancel-btn" data-category="gov">${t('cancel')}</button>
                                </div>
                            </div>
                        `}
                    </div>

                    <!-- ABN INCOME -->
                    <div class="income-category-card" data-category="abn">
                        <div class="category-header">
                            <div class="category-name">${t('abnIncomeTitle')}</div>
                            <button class="category-edit-btn" data-category="abn">${t('edit')}</button>
                        </div>
                        ${!abnEditing ? `
                            <div class="category-stats column">
                                ${abnDisplay}
                            </div>
                            <div class="deduction-hint">${t('abnIncomeHint')}</div>
                            ${renderWarnings(getAbnWarnings())}
                            
                             ${abnNet > 4000 ? `
                                <div class="warning-box warning">
                                    <span class="warning-box-icon">⚠️</span>
                                    <span class="warning-box-text">${t('paygInstalmentWarning')}</span>
                                </div>
                            ` : ''}
                        ` : `
                            <div class="category-edit-form">
                                <div class="edit-field">
                                    <label>${t('abnIncomeLabel')}</label>
                                    <input type="number" class="edit-abn-income" value="${userData.abnIncome || 0}" step="any" min="0">
                                    <small class="form-note">${t('abnIncomeInputHint')}</small>
                                </div>
                                <div class="edit-field">
                                    <label>${t('abnExpensesLabel')}</label>
                                    <input type="number" class="edit-abn-expenses" value="${userData.abnExpenses || 0}" step="any" min="0">
                                    <small class="form-note">${t('abnExpensesHint')}</small>
                                </div>
                                <div class="edit-field">
                                    <label>${t('abnNetLabel')}</label>
                                    <div class="calculated-value" id="abnNetDisplay">${formatCurrency(abnNet)}</div>
                                </div>
                                <div class="edit-field">
                                    <label>${t('abnTaxWithheldLabel')}</label>
                                    <input type="number" class="edit-abn-withheld" value="${userData.abnTaxWithheld || 0}" step="any" min="0">
                                    <small class="form-note">${t('abnTaxWithheldHint')}</small>
                                </div>
                                <div class="edit-actions">
                                    <button class="update-btn" data-category="abn">${t('update')}</button>
                                    <button class="cancel-btn" data-category="abn">${t('cancel')}</button>
                                </div>
                            </div>
                        `}
                    </div>

                    <!-- CAPITAL GAINS -->
                    <div class="income-category-card" data-category="cgt">
                        <div class="category-header">
                            <div class="category-name">${t('capitalGainsTitle')}</div>
                            <button class="category-edit-btn" data-category="cgt">${t('edit')}</button>
                        </div>
                        ${!cgtEditing ? `
                            <div class="category-stats column">
                                ${cgtDisplay}
                            </div>
                            <div class="deduction-hint">${t('capitalGainsHint')}</div>
                            ${renderWarnings(getCgtWarnings())}
                        ` : `
                            <div class="category-edit-form">
                                <div class="edit-field">
                                    <label>${t('capitalGainsLabel')}</label>
                                    <input type="number" class="edit-cgt-gains" value="${userData.capitalGains || 0}" step="any" min="0">
                                    <small class="form-note">${t('capitalGainsInputHint')}</small>
                                </div>
                                <div class="edit-field">
                                    <label>${t('capitalLossesLabel')}</label>
                                    <input type="number" class="edit-cgt-losses" value="${userData.capitalLosses || 0}" step="any" min="0">
                                </div>
                                <div class="edit-field">
                                    <label>${t('priorYearLossesLabel')}</label>
                                    <input type="number" class="edit-cgt-prior" value="${userData.priorYearCapitalLosses || 0}" step="any" min="0">
                                    <small class="form-note">${t('priorYearLossesHint')}</small>
                                </div>
                                <div class="edit-field">
                                    <label>${t('netGainLabel')}</label>
                                    <div class="calculated-value" id="cgtNetDisplay">${formatCurrency(Math.max(0, cgtNet))}</div>
                                </div>
                                <div class="edit-field" style="display:flex; align-items:flex-start; gap:var(--space-3); margin-top:var(--space-2);">
                                    <input type="checkbox" class="edit-cgt-discount" 
                                        id="cgtDiscountCheck"
                                        ${userData.cgtDiscountApplies ? 'checked' : ''}
                                        style="width:1.1rem; height:1.1rem; margin-top:0.2rem; accent-color:var(--accent); flex-shrink:0; cursor:pointer;">
                                    <div>
                                        <label for="cgtDiscountCheck" style="cursor:pointer; font-size:var(--font-sm); color:var(--text-primary); font-weight:500;">
                                            ${t('cgtDiscountLabel')}
                                        </label>
                                        <div class="form-note" style="margin-top:var(--space-1);">${t('cgtDiscountHint')}</div>
                                    </div>
                                </div>
                                <div class="edit-actions">
                                    <button class="update-btn" data-category="cgt">${t('update')}</button>
                                    <button class="cancel-btn" data-category="cgt">${t('cancel')}</button>
                                </div>
                            </div>
                        `}
                    </div>

                    <!-- OTHER -->
                    <div class="income-category-card" data-category="other">
                        <div class="category-header">
                            <div class="category-name">${t('other')}</div>
                            <button class="category-edit-btn" data-category="other">${t('edit')}</button>
                        </div>
                        ${!otherEditing ? `
                            <div class="category-stats">
                                <span><span class="stat-label">${t('descriptionLabel')}:</span> <span class="stat-value">${escapeHtml(oi.otherDescription || t('notEntered'))}</span></span>
                                <span><span class="stat-label">${t('amountLabel')}:</span> <span class="stat-value">${otherDisplay}</span></span>
                            </div>
                        ` : `
                            <div class="category-edit-form">
                                <div class="edit-field">
                                    <label>${t('descriptionLabel')}</label>
                                    <input type="text" class="edit-description" value="${escapeHtml(oi.otherDescription || '')}">
                                </div>
                                <div class="edit-field">
                                    <label>${t('amountLabel')}</label>
                                    <input type="number" class="edit-amount" value="${oi.otherAmount || 0}" step="any" min="0">
                                </div>
                                <div class="edit-actions">
                                    <button class="update-btn" data-category="other">${t('update')}</button>
                                    <button class="cancel-btn" data-category="other">${t('cancel')}</button>
                                </div>
                            </div>
                        `}
                    </div>
                `;

                // Attach edit buttons
                container.querySelectorAll('.category-edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        userData.otherIncome._editing = btn.dataset.category;
                        renderOtherIncomeList();
                    });
                });

                // Live grossed-up calculation
                const editDividends = container.querySelector('.edit-dividends');
                const editFranking = container.querySelector('.edit-franking');
                if (editDividends && editFranking) {
                    const updateGrossed = () => {
                        const gross = (parseFloat(editDividends.value) || 0) + (parseFloat(editFranking.value) || 0);
                        const el = document.getElementById('grossedUpDisplay');
                        if (el) el.textContent = formatCurrency(gross);
                    };
                    editDividends.addEventListener('input', updateGrossed);
                    editFranking.addEventListener('input', updateGrossed);
                }

                // Live ABN net calculation
                const editAbnIncome = container.querySelector('.edit-abn-income');
                const editAbnExpenses = container.querySelector('.edit-abn-expenses');
                if (editAbnIncome && editAbnExpenses) {
                    const updateAbnNet = () => {
                        const net = (parseFloat(editAbnIncome.value) || 0) - (parseFloat(editAbnExpenses.value) || 0);
                        const el = document.getElementById('abnNetDisplay');
                        if (el) {
                            el.textContent = formatCurrency(net);
                            el.style.color = net < 0 ? 'var(--error)' : 'var(--accent)';
                        }
                    };
                    editAbnIncome.addEventListener('input', updateAbnNet);
                    editAbnExpenses.addEventListener('input', updateAbnNet);
                }

                // Live CGT net calculation
                const editGains = container.querySelector('.edit-cgt-gains');
                const editLosses = container.querySelector('.edit-cgt-losses');
                const editPrior = container.querySelector('.edit-cgt-prior');
                if (editGains && editLosses && editPrior) {
                    const updateCgtNet = () => {
                        const net = (parseFloat(editGains.value) || 0)
                            - (parseFloat(editLosses.value) || 0)
                            - (parseFloat(editPrior.value) || 0);
                        const el = document.getElementById('cgtNetDisplay');
                        if (el) {
                            el.textContent = formatCurrency(Math.max(0, net));
                            el.style.color = net <= 0 ? 'var(--text-muted)' : 'var(--accent)';
                        }
                    };
                    editGains.addEventListener('input', updateCgtNet);
                    editLosses.addEventListener('input', updateCgtNet);
                    editPrior.addEventListener('input', updateCgtNet);
                }

               // Update buttons
                container.querySelectorAll('.update-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const catId = btn.dataset.category;
                        const cardDiv = btn.closest('.income-category-card');

                        // Helper function to show inline error
                        function showInlineError(message) {
                            let errorDiv = cardDiv.querySelector('.amount-error');
                            if (!errorDiv) {
                                errorDiv = document.createElement('div');
                                errorDiv.className = 'form-error amount-error';
                                errorDiv.style.display = 'block';
                                errorDiv.innerHTML = `⚠ ${message}`;
                                const editField = cardDiv.querySelector('.edit-field');
                                if (editField) editField.appendChild(errorDiv);
                            }
                            return errorDiv;
                        }

                        function removeInlineError() {
                            const errorDiv = cardDiv.querySelector('.amount-error');
                            if (errorDiv) errorDiv.remove();
                        }

                        if (catId === 'interest') {
                            const val = parseFloat(cardDiv.querySelector('.edit-interest').value) || 0;
                            if (val < 0) {
                                showInlineError(t('amountNegativeError'));
                                return;
                            }
                            removeInlineError();
                            userData.otherIncome.interest = val;

                        } else if (catId === 'dividends') {
                            const divVal = parseFloat(cardDiv.querySelector('.edit-dividends').value) || 0;
                            const frkVal = parseFloat(cardDiv.querySelector('.edit-franking').value) || 0;
                            if (divVal < 0 || frkVal < 0) {
                                showInlineError(t('amountNegativeError'));
                                return;
                            }
                            removeInlineError();
                            userData.otherIncome.dividends = divVal;
                            userData.frankingCredits = frkVal;

                        } else if (catId === 'gov') {
                            const govAmt = parseFloat(cardDiv.querySelector('.edit-gov-amount').value) || 0;
                            const govWht = parseFloat(cardDiv.querySelector('.edit-gov-withheld').value) || 0;
                            if (govAmt < 0 || govWht < 0) {
                                showInlineError(t('amountNegativeError'));
                                return;
                            }
                            removeInlineError();
                            userData.governmentPayments = govAmt;
                            userData.govTaxWithheld = govWht;

                        } else if (catId === 'abn') {
                            const abnInc = parseFloat(cardDiv.querySelector('.edit-abn-income').value) || 0;
                            const abnExp = parseFloat(cardDiv.querySelector('.edit-abn-expenses').value) || 0;
                            const abnWht = parseFloat(cardDiv.querySelector('.edit-abn-withheld').value) || 0;
                            if (abnInc < 0 || abnExp < 0 || abnWht < 0) {
                                showInlineError(t('amountNegativeError'));
                                return;
                            }
                            removeInlineError();
                            userData.abnIncome = abnInc;
                            userData.abnExpenses = abnExp;
                            userData.abnTaxWithheld = abnWht;

                        } else if (catId === 'cgt') {
                            const gains = parseFloat(cardDiv.querySelector('.edit-cgt-gains').value) || 0;
                            const losses = parseFloat(cardDiv.querySelector('.edit-cgt-losses').value) || 0;
                            const prior = parseFloat(cardDiv.querySelector('.edit-cgt-prior').value) || 0;
                            if (gains < 0 || losses < 0 || prior < 0) {
                                showInlineError(t('amountNegativeError'));
                                return;
                            }
                            removeInlineError();
                            userData.capitalGains = gains;
                            userData.capitalLosses = losses;
                            userData.priorYearCapitalLosses = prior;
                            userData.cgtDiscountApplies = cardDiv.querySelector('.edit-cgt-discount')?.checked || false;

                        } else if (catId === 'other') {
                            const amt = parseFloat(cardDiv.querySelector('.edit-amount').value) || 0;
                            if (amt < 0) {
                                showInlineError(t('amountNegativeError'));
                                return;
                            }
                            removeInlineError();
                            userData.otherIncome.otherAmount = amt;
                            userData.otherIncome.otherDescription = cardDiv.querySelector('.edit-description')?.value || '';
                        }

                        delete userData.otherIncome._editing;
                        if (typeof updateEstimateAndDisplay === 'function') updateEstimateAndDisplay(userData);
                        renderOtherIncomeList();
                    });
                });

                 // Cancel buttons
                container.querySelectorAll('.cancel-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const catId = btn.closest('.income-category-card')?.dataset.category;
                        
                        // Restore ABN original values if cancelled
                        if (catId === 'abn' && userData._abnIncomeBackup !== undefined) {
                            userData.abnIncome = userData._abnIncomeBackup;
                            userData.abnExpenses = userData._abnExpensesBackup;
                            userData.abnTaxWithheld = userData._abnTaxWithheldBackup;
                            delete userData._abnIncomeBackup;
                            delete userData._abnExpensesBackup;
                            delete userData._abnTaxWithheldBackup;
                        }
                        
                        delete userData.otherIncome._editing;
                        renderOtherIncomeList();
                        
                        // Clean localStorage
                        //if (typeof //saveCurrentData === 'function') //saveCurrentData();
                    });
                });
            }

            renderOtherIncomeList();
            if (typeof setupUploadListeners === 'function') setupUploadListeners();
            renderEmployerList();
            break;

        case 'deductions':

        const WFH_RATE = window.deductionRates?.wfhRate ?? 0.70;
        const TRAVEL_RATE = window.deductionRates?.travelRate ?? 0.88;

            const deductionItems = [
                {
                    id: 'homeOffice',
                    labelKey: 'homeOffice',
                    hintKey: 'homeOfficeHint',
                    renderDisplay: (data) => {
                        const hours = data.homeOfficeHours || 0;
                        const deduction = hours * WFH_RATE;
                        userData.homeOffice = deduction;
                        return `${hours} hours → ${formatCurrency(deduction)}`;
                    },
                    renderEdit: (data) => `
                        <div class="edit-field">
                            <label>${t('homeOfficeHours')}</label>
                            <input type="number" class="edit-homeOffice-hours" value="${data.homeOfficeHours || 0}" step="1" min="0">
                        </div>
                        <div class="edit-field">
                            <label>${t('homeOfficeCalculated')}</label>
                            <div class="calculated-value">${formatCurrency((data.homeOfficeHours || 0) * WFH_RATE)}</div>
                        </div>
                    `,
                    update: (cardDiv) => {
                        const hours = parseFloat(cardDiv.querySelector('.edit-homeOffice-hours')?.value) || 0;
                        userData.homeOfficeHours = hours;
                        userData.homeOfficeDeduction = hours * WFH_RATE;
                        userData.homeOffice = hours * WFH_RATE;
                        return true;
                    }
                },
                {
                    id: 'travel',
                    labelKey: 'travelExpenses',
                    hintKey: 'travelExpensesHint',
                    renderDisplay: (data) => {
                        if (data.travelMethod === 'cents') {
                            const km = data.travelKilometres || 0;
                            return `Cents per km: ${km} km → ${formatCurrency(Math.min(km, 5000) * TRAVEL_RATE)}`;
                        } else {
                            const expenses = data.travelLogbookExpenses || 0;
                            const percent = data.travelLogbookPercent || 0;
                            return `Logbook: ${formatCurrency(expenses)} @ ${percent}% → ${formatCurrency(expenses * (percent / 100))}`;
                        }
                    },
                    renderEdit: (data) => {
                        const method = data.travelMethod || 'cents';
                        return `
                            <div class="edit-field">
                                <label>Method</label>
                                <select class="edit-travel-method">
                                    <option value="cents" ${method === 'cents' ? 'selected' : ''}>${t('travelMethodCents')}</option>
                                    <option value="logbook" ${method === 'logbook' ? 'selected' : ''}>${t('travelMethodLogbook')}</option>
                                </select>
                            </div>
                            <div class="travel-cents-fields" style="display: ${method === 'cents' ? 'block' : 'none'}">
                                <div class="edit-field">
                                    <label>${t('travelKilometres')}</label>
                                    <input type="number" class="edit-travel-km" value="${data.travelKilometres || 0}" step="1" min="0">
                                </div>
                                <div class="warning-message" style="display: none; color: var(--warning); font-size: var(--font-xs); margin-top: var(--space-2);">
                                    ${t('travelMaxWarning')}
                                </div>
                            </div>
                            <div class="travel-logbook-fields" style="display: ${method === 'logbook' ? 'block' : 'none'}">
                                <div class="edit-field">
                                    <label>${t('travelTotalExpenses')}</label>
                                    <input type="number" class="edit-travel-expenses" value="${data.travelLogbookExpenses || 0}" step="any" min="0">
                                </div>
                                <div class="edit-field">
                                    <label>${t('travelBusinessPercent')}</label>
                                    <input type="number" class="edit-travel-percent" value="${data.travelLogbookPercent || 0}" step="1" min="0" max="100">
                                </div>
                            </div>
                            <div class="edit-field">
                                <label>${t('travelCalculatedDeduction')}</label>
                                <div class="calculated-value">${formatCurrency(data.travelExpenses || 0)}</div>
                            </div>
                        `;
                    },
                    update: (cardDiv) => {
                        const method = cardDiv.querySelector('.edit-travel-method')?.value || 'cents';
                        userData.travelMethod = method;
                        let deduction = 0;
                        if (method === 'cents') {
                            let km = parseFloat(cardDiv.querySelector('.edit-travel-km')?.value) || 0;
                            const warningDiv = cardDiv.querySelector('.warning-message');
                            if (km > 5000) { if (warningDiv) warningDiv.style.display = 'block'; km = 5000; }
                            else { if (warningDiv) warningDiv.style.display = 'none'; }
                            deduction = km * TRAVEL_RATE;
                            userData.travelKilometres = km;
                            userData.travelLogbookExpenses = 0;
                            userData.travelLogbookPercent = 0;
                        } else {
                            const expenses = parseFloat(cardDiv.querySelector('.edit-travel-expenses')?.value) || 0;
                            const percent = parseFloat(cardDiv.querySelector('.edit-travel-percent')?.value) || 0;
                            deduction = expenses * (percent / 100);
                            userData.travelLogbookExpenses = expenses;
                            userData.travelLogbookPercent = percent;
                            userData.travelKilometres = 0;
                        }
                        userData.travelExpenses = Math.round(deduction);
                        return true;
                    }
                },
               {
                    id: 'equipment',
                    labelKey: 'equipment',
                    hintKey: 'equipmentHint',
                    renderDisplay: (data) => {
                        const under300 = data.equipmentUnder300 || 0;
                        const assets = data.equipmentAssets || [];
                        
                        // Calculate total depreciation from assets
                        let totalDepreciation = 0;
                        assets.forEach(asset => {
                            totalDepreciation += calculateAssetDepreciation(asset, data.taxYear);
                        });
                        
                        const totalEquipment = under300 + totalDepreciation;
                        
                        // Store for calculation
                        userData.equipment = totalEquipment;
                        userData.equipmentAssets = assets;
                        
                        let assetsDisplay = '';
                        if (assets.length > 0) {
                            assetsDisplay = ` | ${assets.length} asset(s) depreciated: ${formatCurrency(totalDepreciation)}`;
                        }
                        
                        return `Under $300: ${formatCurrency(under300)}${assetsDisplay} | Total: ${formatCurrency(totalEquipment)}`;
                    },
                    renderEdit: (data) => {
                        const under300 = data.equipmentUnder300 || 0;
                        const assets = data.equipmentAssets || [];
                        const currentTaxYear = data.taxYear || window.activeTaxYearString || '2025-26';
                        const taxYearStart = getTaxYearStartDate(currentTaxYear);
                        
                        let assetsHtml = '';
                        assets.forEach((asset, index) => {
                            assetsHtml += renderAssetItem(asset, index, taxYearStart);
                        });
                        
                        return `
                            <div class="edit-field">
                                <label>${t('equipmentUnder300')}</label>
                                <input type="number" class="edit-equipment-under" value="${under300}" step="any" min="0">
                                <div class="field-hint">${t('equipmentUnder300Hint')}</div>
                            </div>
                            
                            <div class="edit-field equipment-assets-section">
                                <label>${t('equipmentOver300')}</label>
                                <div class="assets-list" id="equipment-assets-list">
                                    ${assetsHtml || '<div class="no-assets">' + t('noAssetsAdded') + '</div>'}
                                </div>
                                <button type="button" class="add-asset-btn" data-action="add-asset">+ ${t('addAsset')}</button>
                            </div>
                            
                            <div class="edit-field equipment-total-preview">
                                <label>${t('equipmentTotalPreview')}</label>
                                <div class="calculated-value" id="equipment-total-preview-value">${formatCurrency(calculateTotalEquipmentPreview(data))}</div>
                            </div>
                        `;
                    },
                    update: (cardDiv) => {
                    const under300 = parseFloat(cardDiv.querySelector('.edit-equipment-under')?.value) || 0;
                    userData.equipmentUnder300 = under300;
                    
                    const assetItems = cardDiv.querySelectorAll('.asset-item');
                    const assets = [];
                    const fyStart = getTaxYearStartDate(userData.taxYear || window.activeTaxYearString);
                    
                    assetItems.forEach(item => {
                        const assetType = item.querySelector('.asset-type')?.value || 'computer';
                        const effectiveLife = getAssetEffectiveLife(assetType);
                        const workPercentage = parseFloat(item.querySelector('.asset-work-percent')?.value) || 100;
                        const originalCost = parseFloat(item.querySelector('.asset-original-cost')?.value) || 0;
                        const purchaseDateDisplay = item.querySelector('.asset-purchase-date')?.value || '';
                        const purchaseDate = parseDateFromInput(purchaseDateDisplay);
                        
                        // Validation
                        let hasError = false;
                        const dateHint = item.querySelector('.date-hint');
                        const costHint = item.querySelector('.cost-hint');
                        
                        if (!purchaseDateDisplay) {
                            dateHint.textContent = t('assetDateMissing');
                            dateHint.style.display = 'block';
                            hasError = true;
                        } else {
                            const validation = isValidPurchaseDate(purchaseDateDisplay, fyStart);
                            if (!validation.valid) {
                                if (validation.error === 'format') dateHint.textContent = t('assetDateInvalid');
                                else if (validation.error === 'future') dateHint.textContent = t('assetDateFuture');
                                else if (validation.error === 'year') dateHint.textContent = t('assetDateYear');
                                else dateHint.textContent = t('assetDateInvalid');
                                dateHint.style.display = 'block';
                                hasError = true;
                            } else {
                                dateHint.style.display = 'none';
                            }
                        }
                        
                        if (originalCost <= 0) {
                            costHint.textContent = t('assetCostMissing');
                            costHint.style.display = 'block';
                            hasError = true;
                        } else {
                            costHint.style.display = 'none';
                        }
                        
                        if (hasError) return; // Skip this asset, don't push
                        
                        // Determine if asset is existing (purchased before current FY start)
                        const purchaseDateObj = new Date(purchaseDate);
                        const fyStartDate = new Date(fyStart);
                        const isExisting = purchaseDateObj < fyStartDate;
                        
                        let depreciation = 0;
                        if (isExisting) {
                            const { remainingValue, remainingLife, fullYearsHeld } = calculateAssetRemainingValue(
                                originalCost, purchaseDate, effectiveLife, fyStart
                            );
                            if (remainingValue <= 0 || remainingLife <= 0 || fullYearsHeld >= effectiveLife) {
                                // Asset fully depreciated – show warning but still allow (depreciation = 0)
                                const warningHint = item.querySelector('.asset-field .warning-hint') || document.createElement('div');
                                warningHint.className = 'field-hint warning-hint';
                                warningHint.textContent = t('assetFullyDepreciated');
                                if (!item.querySelector('.warning-hint')) item.querySelector('.asset-fields-container').appendChild(warningHint);
                                depreciation = 0;
                            } else {
                                // Calculate current year depreciation from remaining value
                                // For existing asset, days held in current FY = full year (365) unless purchased mid-FY? But purchased before FY start, so full year.
                                const dvRate = 2 / remainingLife;
                                const daysHeld = 365; // Full financial year
                                const fullDepreciation = remainingValue * (daysHeld / 365) * dvRate;
                                depreciation = fullDepreciation * (workPercentage / 100);
                                depreciation = Math.round(depreciation);
                            }
                            assets.push({
                                isExisting: true,
                                type: assetType,
                                originalCost: originalCost,
                                purchaseDate: purchaseDate,
                                effectiveLife: effectiveLife,
                                workPercentage: workPercentage,
                                remainingValue: remainingValue,
                                remainingLife: remainingLife,
                                depreciation: depreciation
                            });
                        } else {
                            // New asset – calculate depreciation from original cost
                            const daysHeld = calculateDaysHeld(purchaseDate, userData.taxYear);
                            depreciation = calculateNewAssetDepreciation(originalCost, effectiveLife, daysHeld, workPercentage);
                            assets.push({
                                isExisting: false,
                                type: assetType,
                                originalCost: originalCost,
                                purchaseDate: purchaseDate,
                                effectiveLife: effectiveLife,
                                workPercentage: workPercentage,
                                depreciation: depreciation,
                                remainingValue: originalCost - depreciation
                            });
                        }
                    });
                    
                    userData.equipmentAssets = assets;
                    
                    let totalDepreciation = 0;
                    assets.forEach(asset => totalDepreciation += asset.depreciation);
                    userData.equipment = under300 + totalDepreciation;
                    
                    return true;
                },

                  updatePreview: (editForm) => {
                    const under300 = parseFloat(editForm.querySelector('.edit-equipment-under')?.value) || 0;
                    const assetItems = editForm.querySelectorAll('.asset-item');
                    let totalDepreciation = 0;
                    const fyStart = getTaxYearStartDate(userData.taxYear || window.activeTaxYearString);
                    
                    assetItems.forEach(item => {
                        const assetType = item.querySelector('.asset-type')?.value || 'computer';
                        const effectiveLife = getAssetEffectiveLife(assetType);
                        const workPercentage = parseFloat(item.querySelector('.asset-work-percent')?.value) || 100;
                        const originalCost = parseFloat(item.querySelector('.asset-original-cost')?.value) || 0;
                        const purchaseDateDisplay = item.querySelector('.asset-purchase-date')?.value || '';
                        const purchaseDate = parseDateFromInput(purchaseDateDisplay);
                        
                        if (!purchaseDateDisplay || originalCost <= 0) return; // skip preview if invalid
                        
                        const purchaseDateObj = new Date(purchaseDate);
                        const fyStartDate = new Date(fyStart);
                        const isExisting = purchaseDateObj < fyStartDate;
                        
                        if (isExisting) {
                            const { remainingValue, remainingLife, fullYearsHeld } = calculateAssetRemainingValue(
                                originalCost, purchaseDate, effectiveLife, fyStart
                            );
                            if (remainingValue <= 0 || remainingLife <= 0 || fullYearsHeld >= effectiveLife) {
                                // fully depreciated
                                return;
                            }
                            const dvRate = 2 / remainingLife;
                            const daysHeld = 365;
                            const fullDepreciation = remainingValue * (daysHeld / 365) * dvRate;
                            totalDepreciation += fullDepreciation * (workPercentage / 100);
                        } else {
                            const daysHeld = calculateDaysHeld(purchaseDate, userData.taxYear); 
                            totalDepreciation += calculateNewAssetDepreciation(originalCost, effectiveLife, daysHeld, workPercentage);
                        }
                    });
                    
                    const total = under300 + totalDepreciation;
                    const previewSpan = editForm.querySelector('#equipment-total-preview-value');
                    if (previewSpan) previewSpan.textContent = formatCurrency(total);
                }
                },
                {
                    id: 'selfEducation',
                    labelKey: 'selfEducation',
                    hintKey: 'selfEducationHint',
                    renderDisplay: (data) => formatCurrency(data.selfEducation || 0),
                    renderEdit: (data) => `
                        <div class="edit-field">
                            <label>${t('amount')}</label>
                            <input type="number" class="edit-selfEducation" value="${data.selfEducation || 0}" step="any" min="0">
                            <div class="field-hint">${t('selfEducationDeductionHint')}</div>
                        </div>
                    `,
                    update: (cardDiv) => {
                        userData.selfEducation = parseFloat(cardDiv.querySelector('.edit-selfEducation')?.value) || 0;
                        return true;
                    }
                },
                {
                    id: 'otherDeductions',
                    labelKey: 'otherDeductions',
                    hintKey: 'otherDeductionsHint',
                    renderDisplay: (data) => formatCurrency(data.otherDeductions || 0),
                    renderEdit: (data) => `
                        <div class="edit-field">
                            <label>${t('amount')}</label>
                            <input type="number" class="edit-otherDeductions" value="${data.otherDeductions || 0}" step="any" min="0">
                        </div>
                    `,
                    update: (cardDiv) => {
                        userData.otherDeductions = parseFloat(cardDiv.querySelector('.edit-otherDeductions')?.value) || 0;
                        return true;
                    }
                }
            ];

            function renderDeductionsList() {
                const container = document.getElementById('deductionsList');
                if (!container) return;
                let html = '';
                deductionItems.forEach(item => {
                    const isEditing = (userData._editingDed === item.id);
                    const displayValue = item.renderDisplay(userData);
                    html += `
                        <div class="income-category-card" data-item="${item.id}">
                            <div class="category-header">
                                <div class="category-name">${t(item.labelKey)}</div>
                                <button class="category-edit-btn" data-item="${item.id}">${t('edit')}</button>
                            </div>
                            ${!isEditing ? `
                                <div class="category-stats">
                                    <span class="stat-value">${escapeHtml(displayValue)}</span>
                                </div>
                                ${item.hintKey ? `<div class="deduction-hint">${t(item.hintKey)}</div>` : ''}
                            ` : `
                                <div class="category-edit-form" data-item="${item.id}">
                                    ${item.renderEdit(userData)}
                                    <div class="edit-actions">
                                        <button class="update-btn" data-item="${item.id}">${t('update')}</button>
                                        <button class="cancel-btn" data-item="${item.id}">${t('cancel')}</button>
                                    </div>
                                </div>
                            `}
                        </div>
                    `;
                });
                container.innerHTML = html;

                document.querySelectorAll('.category-edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        userData._editingDed = btn.dataset.item;
                        renderDeductionsList();
                    });
                });
                document.querySelectorAll('.update-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const itemId = btn.dataset.item;
                        const cardDiv = btn.closest('.income-category-card');
                        const item = deductionItems.find(i => i.id === itemId);
                        if (item && item.update) item.update(cardDiv);
                        delete userData._editingDed;
                        if (typeof updateEstimateAndDisplay === 'function') updateEstimateAndDisplay(userData);
                        //saveCurrentData();
                        renderDeductionsList();
                    });
                });
                document.querySelectorAll('.cancel-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        delete userData._editingDed;
                        renderDeductionsList();
                    });
                });

                const methodSelect = document.querySelector('.edit-travel-method');
                if (methodSelect) {
                    const updateTravelFields = () => {
                        const centsDiv = document.querySelector('.travel-cents-fields');
                        const logbookDiv = document.querySelector('.travel-logbook-fields');
                        if (methodSelect.value === 'cents') {
                            if (centsDiv) centsDiv.style.display = 'block';
                            if (logbookDiv) logbookDiv.style.display = 'none';
                        } else {
                            if (centsDiv) centsDiv.style.display = 'none';
                            if (logbookDiv) logbookDiv.style.display = 'block';
                        }
                    };
                    methodSelect.addEventListener('change', updateTravelFields);
                    updateTravelFields();
                }

                // Inside renderDeductionsList(), after the existing event listeners
                // Add handlers for equipment asset buttons

                // Handle Add Asset button
                document.querySelectorAll('.add-asset-btn').forEach(btn => {
                    btn.removeEventListener('click', handleAddAsset);
                    btn.addEventListener('click', handleAddAsset);
                });

                // Handle Delete Asset buttons
                document.querySelectorAll('.asset-delete-btn').forEach(btn => {
                    btn.removeEventListener('click', handleDeleteAsset);
                    btn.addEventListener('click', handleDeleteAsset);
                });
                // Function to add a new asset
                function handleAddAsset(e) {
                    const editForm = e.target.closest('.category-edit-form');
                    if (!editForm) return;
                    const currentAssets = [...(userData.equipmentAssets || [])];
                    currentAssets.push({
                        type: 'computer',
                        originalCost: 0,
                        purchaseDate: '',
                        workPercentage: 100,
                        depreciation: 0
                    });
                    userData.equipmentAssets = currentAssets;
                    const equipmentItem = deductionItems.find(i => i.id === 'equipment');
                    if (equipmentItem) {
                        const newHtml = equipmentItem.renderEdit(userData);
                        const actionsDiv = editForm.querySelector('.edit-actions');
                        editForm.innerHTML = newHtml;
                        if (actionsDiv) editForm.appendChild(actionsDiv);
                        attachEquipmentHandlers(editForm);
                    }
                }

                function handleDeleteAsset(e) {
                    e.stopPropagation();
                    const btn = e.currentTarget;
                    const index = parseInt(btn.dataset.index);
                    if (isNaN(index)) return;
                    
                    const currentAssets = [...(userData.equipmentAssets || [])];
                    currentAssets.splice(index, 1);
                    userData.equipmentAssets = currentAssets;
                    
                    const editForm = btn.closest('.category-edit-form');
                    if (editForm) {
                        const equipmentItem = deductionItems.find(i => i.id === 'equipment');
                        if (equipmentItem) {
                            const newHtml = equipmentItem.renderEdit(userData);
                            const actionsDiv = editForm.querySelector('.edit-actions');
                            editForm.innerHTML = newHtml;
                            if (actionsDiv) editForm.appendChild(actionsDiv);
                            attachEquipmentHandlers(editForm);
                            
                            // Update preview (moved inside the if block)
                            if (equipmentItem.updatePreview) {
                                equipmentItem.updatePreview(editForm);
                            }
                        }
                    }
                    
                    // Update estimate
                    if (typeof updateEstimateAndDisplay === 'function') {
                        updateEstimateAndDisplay(userData);
                    }
                    //saveCurrentData();
                }
                // Helper to attach all equipment-related handlers
                function attachEquipmentHandlers(container) {
                    // Add asset button
                    container.querySelectorAll('.add-asset-btn').forEach(btn => {
                        btn.removeEventListener('click', handleAddAsset);
                        btn.addEventListener('click', handleAddAsset);
                    });
                    
                    // Delete asset buttons
                    container.querySelectorAll('.asset-delete-btn').forEach(btn => {
                        btn.removeEventListener('click', handleDeleteAsset);
                        btn.addEventListener('click', handleDeleteAsset);
                    });
                                        
                    // Real-time preview updates
                    const inputs = container.querySelectorAll('input, select');
                    inputs.forEach(input => {
                        input.removeEventListener('input', updatePreviewDebounced);
                        input.addEventListener('input', updatePreviewDebounced);
                    });
                }

                // ------------------------------------------------------------------
                // Dynamic validation and hints for assets (no checkbox, only original cost)
                // ------------------------------------------------------------------
                function validateAssetFields(assetItem) {
                    const dateInput = assetItem.querySelector('.asset-purchase-date');
                    const costInput = assetItem.querySelector('.asset-original-cost');
                    const dateHint = assetItem.querySelector('.date-hint');
                    const costHint = assetItem.querySelector('.cost-hint');
                    if (!dateInput || !costInput) return;
                    
                    const fyStart = dateInput.dataset.fyStart;
                    const dateValue = dateInput.value;
                    const costValue = parseFloat(costInput.value) || 0;
                    
                    let valid = true;
                    
                    // Date validation
                    if (!dateValue) {
                        dateHint.textContent = t('assetDateMissing');
                        dateHint.style.display = 'block';
                        valid = false;
                    } else {
                        const validation = isValidPurchaseDate(dateValue, fyStart);
                        if (!validation.valid) {
                            if (validation.error === 'format') dateHint.textContent = t('assetDateInvalid');
                            else if (validation.error === 'future') dateHint.textContent = t('assetDateFuture');
                            else if (validation.error === 'year') dateHint.textContent = t('assetDateYear');
                            else dateHint.textContent = t('assetDateInvalid');
                            dateHint.style.display = 'block';
                            valid = false;
                        } else {
                            dateHint.style.display = 'none';
                        }
                    }
                    
                    // Cost validation
                    if (costValue <= 0) {
                        costHint.textContent = t('assetCostMissing');
                        costHint.style.display = 'block';
                        valid = false;
                    } else {
                        costHint.style.display = 'none';
                    }
                    
                    // Fully depreciated check (only if date and cost are valid)
                    if (valid && dateValue && costValue > 0) {
                        const purchaseDate = parseDateFromInput(dateValue);
                        const fyStartDate = new Date(fyStart);
                        const isExisting = new Date(purchaseDate) < fyStartDate;
                        if (isExisting) {
                            const assetType = assetItem.querySelector('.asset-type')?.value || 'computer';
                            const effectiveLife = getAssetEffectiveLife(assetType);
                            const { fullYearsHeld } = calculateAssetRemainingValue(costValue, purchaseDate, effectiveLife, fyStart);
                            if (fullYearsHeld >= effectiveLife) {
                                let warningHint = assetItem.querySelector('.fully-depreciated-warning');
                                if (!warningHint) {
                                    warningHint = document.createElement('div');
                                    warningHint.className = 'field-hint fully-depreciated-warning';
                                    assetItem.querySelector('.asset-fields-container').appendChild(warningHint);
                                }
                                warningHint.textContent = t('assetFullyDepreciated');
                                warningHint.style.display = 'block';
                            } else {
                                const existingWarning = assetItem.querySelector('.fully-depreciated-warning');
                                if (existingWarning) existingWarning.style.display = 'none';
                            }
                        }
                    }
                }

                // Attach blur listeners to purchase date inputs
                document.querySelectorAll('.asset-purchase-date').forEach(input => {
                    input.removeEventListener('blur', () => {});
                    input.addEventListener('blur', function() {
                        validateAssetFields(this.closest('.asset-item'));
                    });
                });

                // Attach input listeners to original cost inputs
                document.querySelectorAll('.asset-original-cost').forEach(input => {
                    input.removeEventListener('input', () => {});
                    input.addEventListener('input', function() {
                        validateAssetFields(this.closest('.asset-item'));
                    });
                });

                // Debounced preview update
                let previewTimeout;
                function updatePreviewDebounced() {
                    if (previewTimeout) clearTimeout(previewTimeout);
                    previewTimeout = setTimeout(() => {
                        const editForm = document.querySelector('.category-edit-form[data-item="equipment"]');
                        if (editForm) {
                            const equipmentItem = deductionItems.find(i => i.id === 'equipment');
                            if (equipmentItem && equipmentItem.updatePreview) {
                                equipmentItem.updatePreview(editForm);
                            }
                        }
                    }, 300);
                }
            }
            renderDeductionsList();
            break;

            case 'adjustments':
            const adjustmentItems = [
                { id: 'fringeBenefits', labelKey: 'fringeBenefits', hintKey: 'fringeBenefitsHint', isNumber: true, min: 0, step: 'any', displayUnit: '$' },
                { id: 'reportableSuper', labelKey: 'reportableSuper', hintKey: 'reportableSuperHint', isNumber: true, min: 0, step: 'any', displayUnit: '$' },
                { id: 'taxFreeGovPayments', labelKey: 'taxFreeGovPayments', hintKey: 'taxFreeGovPaymentsHint', isNumber: true, min: 0, step: 'any', displayUnit: '$' },
                { id: 'targetForeignIncome', labelKey: 'targetForeignIncome', hintKey: 'targetForeignIncomeHint', isNumber: true, min: 0, step: 'any', displayUnit: '$' },
                { id: 'financialInvestmentLoss', labelKey: 'financialInvestmentLoss', hintKey: 'financialInvestmentLossHint', isNumber: true, min: 0, step: 'any', displayUnit: '$' },
                { id: 'childSupportPaid', labelKey: 'childSupportPaid', hintKey: 'childSupportPaidHint', isNumber: true, min: 0, step: 'any', displayUnit: '$' },
                { id: 'dependentChildren', labelKey: 'dependentChildren', hintKey: 'dependentChildrenHint', isNumber: true, min: 0, max: 20, step: 1, displayUnit: '' }
            ];

            function renderAdjustmentsList() {
                const container = document.getElementById('adjustmentsList');
                if (!container) return;
                let html = '';

                // Existing adjustment items (fringeBenefits, reportableSuper, etc.)
                adjustmentItems.forEach(item => {
                    const value = userData[item.id] || 0;
                    const isEditing = (userData._editingAdj === item.id);
                    let displayValue = value === 0 ? t('notEntered') :
                        (item.id === 'dependentChildren' ? value.toString() : formatCurrency(value));

                    html += `
                        <div class="income-category-card" data-item="${item.id}">
                            <div class="category-header">
                                <div class="category-name">${t(item.labelKey)}</div>
                                <button class="category-edit-btn" data-item="${item.id}">${t('edit')}</button>
                            </div>
                            ${!isEditing ? `
                                <div class="category-stats">
                                    <span><span class="stat-label">${item.id === 'dependentChildren' ? t('number') : t('amount')}:</span> <span class="stat-value">${escapeHtml(displayValue)}</span></span>
                                </div>
                                ${item.hintKey ? `<div class="adjustment-hint">${t(item.hintKey)}</div>` : ''}
                            ` : `
                                <div class="category-edit-form">
                                    <div class="edit-field">
                                        <label>${item.id === 'dependentChildren' ? t('number') : t('amount')}</label>
                                        <input type="number" class="edit-value" value="${value}" step="${item.step}" min="${item.min || 0}" ${item.max ? `max="${item.max}"` : ''}>
                                    </div>
                                    <div class="edit-actions">
                                        <button class="update-btn" data-item="${item.id}">${t('update')}</button>
                                        <button class="cancel-btn" data-item="${item.id}">${t('cancel')}</button>
                                    </div>
                                </div>
                            `}
                        </div>
                    `;
                });

                // Rental property section (existing)
                const rentalEditing = (userData._editingAdj === 'rental');
                const rentalIncomeVal = userData.rentalIncome || 0;
                const rentalExpensesVal = userData.rentalExpenses || 0;
                const rentalNet = rentalIncomeVal - rentalExpensesVal;
                const rentalDisplay = rentalIncomeVal === 0 && rentalExpensesVal === 0 ? t('notEntered') :
                    `Income: ${formatCurrency(rentalIncomeVal)} | Expenses: ${formatCurrency(rentalExpensesVal)} | Net: ${rentalNet >= 0 ? formatCurrency(rentalNet) : `-${formatCurrency(Math.abs(rentalNet))}`}`;

                html += `
                    <div class="income-category-card" data-item="rental">
                        <div class="category-header">
                            <div class="category-name">${t('rentalProperty')}</div>
                            <button class="category-edit-btn" data-item="rental">${t('edit')}</button>
                        </div>
                        ${!rentalEditing ? `
                            <div class="category-stats"><span><span class="stat-value">${escapeHtml(rentalDisplay)}</span></span></div>
                            <div class="adjustment-hint">${t('rentalNetHint')}</div>
                        ` : `
                            <div class="category-edit-form">
                                <div class="edit-field">
                                    <label>${t('rentalIncomeLabel')}</label>
                                    <input type="number" class="edit-rental-income" value="${rentalIncomeVal}" step="any" min="0">
                                </div>
                                <div class="edit-field">
                                    <label>${t('rentalExpensesLabel')}</label>
                                    <input type="number" class="edit-rental-expenses" value="${rentalExpensesVal}" step="any" min="0">
                                </div>
                                <div class="edit-actions">
                                    <button class="update-btn" data-item="rental">${t('update')}</button>
                                    <button class="cancel-btn" data-item="rental">${t('cancel')}</button>
                                </div>
                            </div>
                        `}
                    </div>
                `;

                // ========== NEW: HELP / HECS Loan Section ==========
                const hecsEditing = (userData._editingAdj === 'hecs');
                const hasHecsLoan = userData.hasHecsLoan === true;
                const manualRepaymentIncome = userData.hecsManualRepaymentIncome || 0;

                let hecsDisplay = t('notSelected');
                if (userData.hasHecsLoan !== undefined) {
                    hecsDisplay = userData.hasHecsLoan ? t('hecsYes') : t('hecsNo');
                    if (userData.hasHecsLoan && manualRepaymentIncome > 0) {
                        hecsDisplay += ` | ${t('hecsManualIncome')}: ${formatCurrency(manualRepaymentIncome)}`;
                    }
                }

                html += `
                    <div class="income-category-card" data-item="hecs">
                        <div class="category-header">
                            <div class="category-name">${t('hecsLoanLabel')}</div>
                            <button class="category-edit-btn" data-item="hecs">${t('edit')}</button>
                        </div>
                        ${!hecsEditing ? `
                            <div class="category-stats"><span class="stat-value">${hecsDisplay}</span></div>
                            <div class="adjustment-hint">${t('hecsHint')}</div>
                        ` : `
                            <div class="category-edit-form">
                                <div class="radio-group" style="margin-bottom: var(--space-3);">
                                    <label><input type="radio" name="hecsStatus" value="yes" ${userData.hasHecsLoan === true ? 'checked' : ''}> ${t('hecsYes')}</label>
                                    <label><input type="radio" name="hecsStatus" value="no" ${userData.hasHecsLoan === false ? 'checked' : ''}> ${t('hecsNo')}</label>
                                </div>
                                <div class="hecs-manual-field" style="display: ${hasHecsLoan ? 'block' : 'none'}; margin-bottom: var(--space-3);">
                                    <div class="edit-field">
                                        <label>${t('hecsManualIncomeLabel')}</label>
                                        <input type="number" class="edit-hecs-manual-income" value="${manualRepaymentIncome}" step="any" min="0">
                                        <div class="field-hint">${t('hecsManualIncomeHint')}</div>
                                    </div>
                                </div>
                                <div class="edit-actions">
                                    <button class="update-btn" data-item="hecs">${t('update')}</button>
                                    <button class="cancel-btn" data-item="hecs">${t('cancel')}</button>
                                </div>
                            </div>
                        `}
                    </div>
                `;

                container.innerHTML = html;

                // ----- Edit button handlers (unchanged) -----
                document.querySelectorAll('.category-edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        userData._editingAdj = btn.dataset.item;
                        renderAdjustmentsList();
                    });
                });

                // ----- Update button handlers (add HECS case) -----
                document.querySelectorAll('.update-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const itemId = btn.dataset.item;
                        const cardDiv = btn.closest('.income-category-card');

                        if (itemId === 'rental') {
                            const income = parseFloat(cardDiv.querySelector('.edit-rental-income')?.value) || 0;
                            const expenses = parseFloat(cardDiv.querySelector('.edit-rental-expenses')?.value) || 0;
                            if (income < 0 || expenses < 0) { alert('Income and expenses cannot be negative.'); return; }
                            userData.rentalIncome = income;
                            userData.rentalExpenses = expenses;
                        } 
                        else if (itemId === 'hecs') {
                            const isYes = cardDiv.querySelector('input[name="hecsStatus"]:checked')?.value === 'yes';
                            userData.hasHecsLoan = isYes;
                            if (isYes) {
                                const manualIncome = parseFloat(cardDiv.querySelector('.edit-hecs-manual-income')?.value) || 0;
                                userData.hecsManualRepaymentIncome = manualIncome;
                            } else {
                                userData.hecsManualRepaymentIncome = 0;
                            }
                        }
                        else {
                            let value = parseFloat(cardDiv.querySelector('.edit-value')?.value) || 0;
                            if (itemId === 'dependentChildren') {
                                value = Math.min(20, Math.max(0, Math.floor(value)));
                            } else if (value < 0) {
                                alert('Amount cannot be negative.'); return;
                            }
                            userData[itemId] = value;
                        }

                        delete userData._editingAdj;
                        if (typeof updateEstimateAndDisplay === 'function') updateEstimateAndDisplay(userData);
                        renderAdjustmentsList();
                    });
                });

                // ----- Cancel button handlers (unchanged) -----
                document.querySelectorAll('.cancel-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        delete userData._editingAdj;
                        renderAdjustmentsList();
                    });
                });

                // ----- Toggle manual income field for HECS based on radio selection -----
                const hecsRadios = document.querySelectorAll('input[name="hecsStatus"]');
                const hecsManualField = document.querySelector('.hecs-manual-field');
                if (hecsRadios.length) {
                    const updateHecsField = () => {
                        const isYes = document.querySelector('input[name="hecsStatus"]:checked')?.value === 'yes';
                        if (hecsManualField) hecsManualField.style.display = isYes ? 'block' : 'none';
                    };
                    hecsRadios.forEach(r => r.addEventListener('change', updateHecsField));
                    updateHecsField();
                }
            }

            renderAdjustmentsList();
            break;

        case 'health':
            const healthItems = [
                {
                    id: 'hospitalCover',
                    labelKey: 'hospitalCover',
                    hintKey: 'hospitalCoverHint',
                    renderDisplay: (data) => {
                        if (data.hasPrivateHospitalCover === undefined) return t('notSelected');
                        if (data.hasPrivateHospitalCover === false) return t('coverStatusNo');
                        if (data.daysWithoutCover === 0) return t('coverStatusYes');
                        return `${t('coverStatusYesPartial')} (${data.daysWithoutCover} days without cover)`;
                    },
                    renderEdit: (data) => {
                        let status = undefined;
                        if (data.hasPrivateHospitalCover === false) status = 'no';
                        else if (data.hasPrivateHospitalCover === true && data.daysWithoutCover === 0) status = 'full';
                        else if (data.hasPrivateHospitalCover === true && data.daysWithoutCover > 0) status = 'partial';
                        return `
                            <div class="radio-group">
                                <label><input type="radio" name="coverStatus" value="full" ${status === 'full' ? 'checked' : ''}> ${t('coverStatusYes')}</label>
                                <label><input type="radio" name="coverStatus" value="partial" ${status === 'partial' ? 'checked' : ''}> ${t('coverStatusYesPartial')}</label>
                                <label><input type="radio" name="coverStatus" value="no" ${status === 'no' ? 'checked' : ''}> ${t('coverStatusNo')}</label>
                            </div>
                            <div class="edit-field days-field" style="display: ${status === 'partial' ? 'block' : 'none'}">
                                <label>${t('daysWithoutCover')}</label>
                                <input type="number" class="edit-days" value="${data.daysWithoutCover || 0}" min="0" max="365">
                                <div class="health-hint">${t('daysWithoutCoverHint')}</div>
                            </div>
                        `;
                    },
                    update: (cardDiv) => {
                        const selected = cardDiv.querySelector('input[name="coverStatus"]:checked')?.value;
                        if (!selected) return false;
                        if (selected === 'no') {
                            userData.hasPrivateHospitalCover = false;
                            userData.daysWithoutCover = 365;
                        } else if (selected === 'full') {
                            userData.hasPrivateHospitalCover = true;
                            userData.daysWithoutCover = 0;
                        } else {
                            userData.hasPrivateHospitalCover = true;
                            userData.daysWithoutCover = Math.min(365, Math.max(0, parseInt(cardDiv.querySelector('.edit-days')?.value) || 0));
                        }
                        return true;
                    }
                },
                {
                    id: 'familySituation',
                    labelKey: 'familySituation',
                    hintKey: 'familySituationHint',
                    renderDisplay: (data) => {
                        if (data.isSingle === undefined) return t('notSelected');
                        let display = data.isSingle ? t('familySingle') : t('familyCouple');
                        if (!data.isSingle && data.spouseIncome) {
                            display += ` | ${t('spouseIncomeLabel')}: ${formatCurrency(data.spouseIncome)}`;
                        }
                        return display;
                    },
                    renderEdit: (data) => {
                        const isSingle = data.isSingle !== undefined ? data.isSingle : true;
                        return `
                            <div class="radio-group">
                                <label><input type="radio" name="familyStatus" value="single" ${isSingle ? 'checked' : ''}> ${t('familySingle')}</label>
                                <label><input type="radio" name="familyStatus" value="couple" ${!isSingle ? 'checked' : ''}> ${t('familyCouple')}</label>
                            </div>
                            <div class="spouse-income-field" style="display: ${!isSingle ? 'block' : 'none'}; margin-top: var(--space-3);">
                                <div class="edit-field">
                                    <label>${t('spouseIncomeLabel')}</label>
                                    <input type="number" class="edit-spouse-income" value="${data.spouseIncome || 0}" step="any" min="0">
                                    <div class="field-hint">${t('spouseIncomeHint')}</div>
                                </div>
                            </div>
                        `;
                    },
                    update: (cardDiv) => {
                        const selected = cardDiv.querySelector('input[name="familyStatus"]:checked')?.value;
                        if (!selected) return false;
                        userData.isSingle = (selected === 'single');
                        
                        const spouseIncomeInput = cardDiv.querySelector('.edit-spouse-income');
                        if (spouseIncomeInput && !userData.isSingle) {
                            userData.spouseIncome = parseFloat(spouseIncomeInput.value) || 0;
                        } else {
                            userData.spouseIncome = 0;
                        }
                        return true;
                    }
                },
                {
                    id: 'phiRebate',
                    labelKey: 'phiRebate',
                    hintKey: 'phiRebateHint',
                    renderDisplay: (data) => {
                        if (!data.phiRebateMethod) return t('notSelected');
                        if (data.phiRebateMethod === 'upfront') return t('phiRebateUpfront');
                        if (data.phiRebateMethod === 'taxtime') {
                             const rebateAmount = calculatePhiRebate(data);
                            return `${t('phiRebateTaxTime')} - ${t('estimatedRebateShort')}: ${formatCurrency(rebateAmount)}`;
                        }
                        return t('phiRebateNone');
                    },
                  renderEdit: (data) => {
                        const method = data.phiRebateMethod || '';
                        const annualPremium = data.annualPremium || 0;
                        
                        return `
                            <div class="radio-group">
                                <label><input type="radio" name="rebateMethod" value="upfront" ${method === 'upfront' ? 'checked' : ''}> ${t('phiRebateUpfront')}</label>
                                <label><input type="radio" name="rebateMethod" value="taxtime" ${method === 'taxtime' ? 'checked' : ''}> ${t('phiRebateTaxTime')}</label>
                                <label><input type="radio" name="rebateMethod" value="none" ${method === 'none' ? 'checked' : ''}> ${t('phiRebateNone')}</label>
                            </div>
                            <div class="taxtime-fields" style="display: ${method === 'taxtime' ? 'block' : 'none'}">
                                <div class="edit-field">
                                    <label>${t('annualPremiumLabel')}</label>
                                    <input type="number" class="edit-annual-premium" value="${annualPremium}" step="any" min="0">
                                    <div class="field-hint">${t('annualPremiumHint')}</div>
                                </div>
                                <div class="edit-field">
                                    <label>${t('phiRebateTierSelect')}</label>
                                    <div class="calculated-value" id="phiTierDisplay">${getTierDisplayText(data)}</div>
                                    <div class="field-hint">${t('phiRebateTierAutoHint')}</div>
                                </div>
                                <div class="edit-field">
                                    <label>${t('estimatedRebateLabel')}</label>
                                    <div class="calculated-value" id="estimatedRebateDisplay">${formatCurrency(calculatePhiRebate(data))}</div>
                                    <div class="field-hint">${t('estimatedRebateHint')}</div>
                                </div>
                            </div>
                        `;

                    },
                    update: (cardDiv) => {
                    const editForm = cardDiv.querySelector('.category-edit-form');
                    if (!editForm) return false;
                    
                    const method = editForm.querySelector('input[name="rebateMethod"]:checked')?.value;
                    if (!method) return false;
                    
                    userData.phiRebateMethod = method;
                    
                    if (method === 'taxtime') {
                        const annualPremium = parseFloat(editForm.querySelector('.edit-annual-premium')?.value) || 0;
                        userData.annualPremium = annualPremium;

                    } else {
                        userData.annualPremium = 0;
                    }
                    
                    if (typeof updateEstimateAndDisplay === 'function') {
                        updateEstimateAndDisplay(userData);
                    }
                    
                    return true;
                }
                },
                {
                    id: 'lhcLoading',
                    labelKey: 'lhcLoading',
                    hintKey: 'lhcLoadingHint',
                    renderDisplay: (data) => {
                        if (data.lhcLoading === undefined) return t('notSelected');
                        return data.lhcLoading ? t('lhcLoadingYes') : t('lhcLoadingNo');
                    },
                    renderEdit: (data) => `
                        <div class="radio-group">
                            <label><input type="radio" name="lhcLoading" value="yes" ${data.lhcLoading === true ? 'checked' : ''}> ${t('lhcLoadingYes')}</label>
                            <label><input type="radio" name="lhcLoading" value="no" ${data.lhcLoading === false ? 'checked' : ''}> ${t('lhcLoadingNo')}</label>
                        </div>
                    `,
                    update: (cardDiv) => {
                        const selected = cardDiv.querySelector('input[name="lhcLoading"]:checked')?.value;
                        if (!selected) return false;
                        userData.lhcLoading = (selected === 'yes');
                        return true;
                    }
                }
            ];

            function renderHealthList() {
                const container = document.getElementById('healthList');
                if (!container) return;
                let html = '';
                healthItems.forEach(item => {
                    const isEditing = (userData._editingHealth === item.id);
                    html += `
                        <div class="income-category-card" data-item="${item.id}">
                            <div class="category-header">
                                <div class="category-name">${t(item.labelKey)}</div>
                                <button class="category-edit-btn" data-item="${item.id}">${t('edit')}</button>
                            </div>
                            ${!isEditing ? `
                                <div class="category-stats">
                                    <span class="stat-value">${item.renderDisplay(userData)}</span>
                                </div>
                                ${item.hintKey ? `<div class="health-hint">${t(item.hintKey)}</div>` : ''}
                            ` : `
                                <div class="category-edit-form" data-item="${item.id}">
                                    ${item.renderEdit(userData)}
                                    <div class="edit-actions">
                                        <button class="update-btn" data-item="${item.id}">${t('update')}</button>
                                        <button class="cancel-btn" data-item="${item.id}">${t('cancel')}</button>
                                    </div>
                                </div>
                            `}
                        </div>
                    `;
                });
                container.innerHTML = html;

                 // Toggle spouse income field based on family status
                const familyRadios = document.querySelectorAll('input[name="familyStatus"]');
                const spouseIncomeField = document.querySelector('.spouse-income-field');

                function toggleSpouseField() {
                    const isSingle = document.querySelector('input[name="familyStatus"]:checked')?.value === 'single';
                    if (spouseIncomeField) {
                        spouseIncomeField.style.display = isSingle ? 'none' : 'block';
                    }
                }

                if (familyRadios.length) {
                    familyRadios.forEach(radio => radio.addEventListener('change', toggleSpouseField));
                    toggleSpouseField();
                }

                                // Live PHI rebate preview update
                const annualPremiumInput = document.querySelector('.edit-annual-premium');
                const methodRadios = document.querySelectorAll('input[name="rebateMethod"]');

                function updatePhiRebatePreview() {
                    const method = document.querySelector('input[name="rebateMethod"]:checked')?.value;
                    const annualPremium = parseFloat(document.querySelector('.edit-annual-premium')?.value) || 0;
                    
                    // Get family status and spouse income from saved userData (not DOM)
                    const isSingle = userData.isSingle !== undefined ? userData.isSingle : true;
                    const spouseIncome = userData.spouseIncome || 0;
                    const taxableIncome = userData.taxableIncome || 0;  // Will be updated when user has income
                    
                    if (method === 'taxtime' && annualPremium > 0) {
                        const previewData = { 
                            phiRebateMethod: method,
                            annualPremium: annualPremium,
                            taxableIncome: taxableIncome,
                            isSingle: isSingle,
                            spouseIncome: spouseIncome,
                            dependentChildren: userData.dependentChildren || 0,
                            dob: userData.dob,
                            taxYear: userData.taxYear || '2025-26'
                        };
                        
                        const rebate = calculatePhiRebate(previewData);
                        const displayElem = document.getElementById('estimatedRebateDisplay');
                        if (displayElem) displayElem.textContent = formatCurrency(rebate);
                        
                        const tierDisplayElem = document.getElementById('phiTierDisplay');
                        if (tierDisplayElem && typeof getTierDisplayText === 'function') {
                            tierDisplayElem.innerHTML = getTierDisplayText(previewData);
                        }
                    } else {
                        const displayElem = document.getElementById('estimatedRebateDisplay');
                        if (displayElem) displayElem.textContent = formatCurrency(0);
                    }
                }

                // Bind preview updates
                if (annualPremiumInput) {
                    annualPremiumInput.addEventListener('input', updatePhiRebatePreview);
                }
                methodRadios.forEach(radio => radio.addEventListener('change', updatePhiRebatePreview));

                // Edit/Cancel/Update buttons (unchanged)
                document.querySelectorAll('.category-edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => { userData._editingHealth = btn.dataset.item; renderHealthList(); });
                });
                document.querySelectorAll('.update-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const item = healthItems.find(i => i.id === btn.dataset.item);
                        if (item && item.update) {
                            const success = item.update(btn.closest('.income-category-card'));
                            if (!success) return;
                        }
                        delete userData._editingHealth;
                        if (typeof updateEstimateAndDisplay === 'function') updateEstimateAndDisplay(userData);
                        //saveCurrentData();
                        renderHealthList();
                    });
                });
                document.querySelectorAll('.cancel-btn').forEach(btn => {
                    btn.addEventListener('click', () => { delete userData._editingHealth; renderHealthList(); });
                });

                // Cover status: show/hide days field
                const coverRadios = document.querySelectorAll('input[name="coverStatus"]');
                if (coverRadios.length) {
                    const updateDaysField = () => {
                        const selected = document.querySelector('input[name="coverStatus"]:checked')?.value;
                        const daysField = document.querySelector('.days-field');
                        if (daysField) daysField.style.display = selected === 'partial' ? 'block' : 'none';
                    };
                    coverRadios.forEach(r => r.addEventListener('change', updateDaysField));
                    updateDaysField();
                }

                // Rebate method: show/hide taxtime fields (fixed from .tier-fields to .taxtime-fields)
                const rebateRadios = document.querySelectorAll('input[name="rebateMethod"]');
                if (rebateRadios.length) {
                    const updateTaxtimeFields = () => {
                        const selected = document.querySelector('input[name="rebateMethod"]:checked')?.value;
                        const taxtimeFields = document.querySelector('.taxtime-fields');
                        if (taxtimeFields) {
                            taxtimeFields.style.display = selected === 'taxtime' ? 'block' : 'none';
                        }
                    };
                    rebateRadios.forEach(r => r.addEventListener('change', updateTaxtimeFields));
                    updateTaxtimeFields(); // run once to set initial visibility
                }
            }
            renderHealthList();
            break;

        case 'review':
            document.querySelectorAll('.review-edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const cardIndex = cards.findIndex(c => c.id === btn.dataset.card);
                    if (cardIndex !== -1) {
                        sessionStorage.setItem('returnToReview', 'true');
                        currentCardIndex = cardIndex;
                        renderCard();
                        updateNextButtonLabel(); // ← AFTER renderCard, not before
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            });
            break;

            case 'declaration':
                let selectedMethod = userData.deliveryMethod || null;
                const deliveryCards = document.querySelectorAll('.delivery-card');
                const emailField = document.querySelector('.delivery-email-field');
                const userEmailDisplay = document.getElementById('userEmailDisplay');

                // Pre-fill email from Personal Info (not editable)
                if (userEmailDisplay && userData.email) {
                    userEmailDisplay.textContent = userData.email;
                }

                deliveryCards.forEach(card => {
                    card.addEventListener('click', () => {
                        deliveryCards.forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        selectedMethod = card.dataset.method;
                        if (emailField) emailField.style.display = selectedMethod === 'email' ? 'flex' : 'none';
                        userData.deliveryMethod = selectedMethod;
                        //saveCurrentData();
                    });
                });

                if (userData.deliveryMethod) {
                    const savedCard = document.querySelector(`.delivery-card[data-method="${userData.deliveryMethod}"]`);
                    if (savedCard) savedCard.click();
                }

                const bilingualCheckbox = document.getElementById('bilingualReportCheckbox');
                if (bilingualCheckbox) {
                    bilingualCheckbox.addEventListener('change', (e) => {
                        userData.bilingualReport = e.target.checked;
                        //saveCurrentData();
                    });
                }
                break;
                
        case 'payment':
            function initPaymentCard() {
                const employerCount = (userData.employers || []).length;
                const hasAbn = (userData.abnIncome || 0) > 0;

                let currentTotal;
                if (hasAbn) {
                    currentTotal = window.pricing.abn_fee || 89.99;
                } else if (employerCount > 1) {
                    currentTotal = window.pricing.multiple_jobs_fee || 79.99;
                } else {
                    currentTotal = window.pricing.standard_fee || 69.99;
                }
                let discountAmount = 0;
                let appliedPromo = null;

                if (userData.appliedPromo) {
                    appliedPromo = userData.appliedPromo;
                    discountAmount = appliedPromo.discount;
                    userData.promoCode = userData.appliedPromo.code;
                    userData.discountAmount = discountAmount;
                    const baseFee = hasAbn
                    ? (window.pricing.abn_fee || 89.99)
                    : employerCount > 1
                        ? (window.pricing.multiple_jobs_fee || 79.99)
                        : (window.pricing.standard_fee || 69.99);
                    userData.originalTotal = baseFee;
                    userData.finalTotal = baseFee - discountAmount;
                    currentTotal = userData.finalTotal;

                    const discountRow = document.getElementById('discountRow');
                    const totalSpan = document.getElementById('totalAmount');
                    const discountAmountSpan = document.getElementById('discountAmountSpan');
                    if (discountRow) discountRow.style.display = 'flex';
                    if (totalSpan) totalSpan.innerText = formatCurrency(currentTotal);
                    if (discountAmountSpan) discountAmountSpan.innerText = `- ${formatCurrency(discountAmount)}`;
                }

                const updatePayButton = () => {
                    const payBtn = document.getElementById('payBtn');
                    if (payBtn) {
                        payBtn.innerText = `${stripHtml(t('payButtonLabel'))} — ${formatCurrency(currentTotal)}`;
                    }
                };
                updatePayButton();

                if (typeof initStripePayment === 'function') {
                    initStripePayment(currentTotal);
                }

                const promoToggleBtn = document.getElementById('promoToggleBtn');
                const promoSection = document.getElementById('promoSection');
                if (promoToggleBtn && promoSection) {
                    promoToggleBtn.addEventListener('click', () => {
                        const isVisible = promoSection.style.display !== 'none';
                        promoSection.style.display = isVisible ? 'none' : 'block';
                        promoToggleBtn.style.opacity = isVisible ? '1' : '0.6';
                    });
                }

                const applyPromoBtn = document.getElementById('applyPromoBtn');
                const promoInput = document.getElementById('promoCodeInput');
                const promoMessage = document.getElementById('promoMessage');
                const discountRow = document.getElementById('discountRow');
                const totalSpan = document.getElementById('totalAmount');

                if (applyPromoBtn) {
                    applyPromoBtn.addEventListener('click', async () => {
                        const code = (promoInput?.value || '').trim().toUpperCase();
                        if (!code) {
                            if (promoMessage) {
                                promoMessage.innerHTML = t('promoEnterCode');
                                promoMessage.className = 'promo-message error';
                            }
                            return;
                        }

                        if (promoMessage) {
                            promoMessage.innerHTML = t('promoChecking') || 'Checking...';
                            promoMessage.className = 'promo-message';
                        }

                        // Use the new validatePromoCode function
                        const result = await validatePromoCode(code, userData);

                        if (result.valid && result.discount > 0) {
                            discountAmount = result.discount;
                            appliedPromo = { code, discount: discountAmount };
                            userData.appliedPromo = appliedPromo;
                            userData.promoCode = code;
                            userData.discountAmount = discountAmount;
                            
                            const baseFee = hasAbn
                                ? (window.pricing.abn_fee || 89.99)
                                : employerCount > 1
                                    ? (window.pricing.multiple_jobs_fee || 79.99)
                                    : (window.pricing.standard_fee || 69.99);
                            userData.originalTotal = baseFee;
                            userData.finalTotal = baseFee - discountAmount;
                            currentTotal = userData.finalTotal;

                            if (discountRow) discountRow.style.display = 'flex';
                            if (totalSpan) totalSpan.innerText = formatCurrency(currentTotal);
                            const discountAmountSpan = document.getElementById('discountAmountSpan');
                            if (discountAmountSpan) discountAmountSpan.innerText = `- ${formatCurrency(discountAmount)}`;
                            
                            if (promoMessage) {
                                promoMessage.innerHTML = t('promoApplied').replace(/\{amount\}/g, formatCurrency(discountAmount));
                                promoMessage.className = 'promo-message success';
                                if (promoInput) promoInput.value = '';
                            }
                            
                            updatePayButton();
                            if (typeof initStripePayment === 'function') {
                                initStripePayment(currentTotal);
                            }
                        } else {
                            // Display the error message from validation (or fallback)
                            const errorMsg = result.message || t('promoInvalid');
                            if (promoMessage) {
                                promoMessage.innerHTML = errorMsg;
                                promoMessage.className = 'promo-message error';
                                if (promoInput) promoInput.value = '';
                            }
                        }
                    });
                }
                const payBtn = document.getElementById('payBtn');
                if (payBtn) {
                    payBtn.addEventListener('click', async () => {
                        if (typeof initStripePayment === 'function') {
                            initStripePayment(currentTotal);
                        }
                        if (typeof processCardPayment === 'function') {
                            await processCardPayment();
                        }
                    });
                }

                const closeModalBtn = document.getElementById('closeSuccessModal');
                const successModal = document.getElementById('paymentSuccessModal');
                if (closeModalBtn) {
                    closeModalBtn.addEventListener('click', () => {
                        if (successModal) successModal.style.display = 'none';
                        resetUserData();                 // Reset all data
                        currentCardIndex = 0;           // Go to first card
                        renderCard();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    });
                }

                const leftFallbackBtn = document.getElementById('fallbackLeftBtn');
                const rightFallbackBtn = document.getElementById('fallbackRightBtn');

                if (leftFallbackBtn) {
                    leftFallbackBtn.addEventListener('click', async () => {
                        const userLang = window.currentLang === 'zh' ? 'zh' : 'en';
                        if ((userData.deliveryMethod || 'download') === 'download') {
                            // Download again
                            if (typeof generateTaxReport === 'function') generateTaxReport(userData, userLang);
                        } else {
                            // RESEND EMAIL
                            if (!window.lastUploadedPdfPath) {
                                alert('PDF path not found. Please download instead.');
                                return;
                            }
                            
                            leftFallbackBtn.disabled = true;
                            leftFallbackBtn.innerText = 'Sending...';
                            
                            try {
                                const { data, error } = await window.supabase.functions.invoke('send-report-email', {
                                    body: {
                                        to: userData.email,
                                        pdfUrl: window.lastUploadedPdfPath,
                                        customerName: userData.fullName || 'Valued Customer',
                                        declarationId: window.latestPaymentIntentId
                                    }
                                });
                                
                                if (error) throw error;
                                alert('Report resent successfully! Please check your email (including spam folder).');
                            } catch (err) {
                                console.error('Resend failed:', err);
                                alert('Failed to resend email. Please download your report below.');
                            } finally {
                                leftFallbackBtn.disabled = false;
                                leftFallbackBtn.innerText = stripHtml(t('resendReport'));
                            }
                        }
                    });
                }

                if (rightFallbackBtn) {
                    rightFallbackBtn.addEventListener('click', async () => {
                        const userLang = window.currentLang === 'zh' ? 'zh' : 'en';
                        if ((userData.deliveryMethod || 'download') === 'download') {
                            const email = userData.email;
                            if (!email || !email.includes('@')) {
                                alert('No email address found. Please download instead.');
                                return;
                            }
                            if (!window.lastUploadedPdfPath) {
                                alert('PDF not ready. Please download instead.');
                                return;
                            }
                            rightFallbackBtn.disabled = true;
                            rightFallbackBtn.innerText = 'Sending...';
                            try {
                                const { data, error } = await window.supabase.functions.invoke('send-report-email', {
                                    body: {
                                        to: email,
                                        pdfUrl: window.lastUploadedPdfPath,
                                        customerName: userData.fullName || '',
                                        declarationId: window.latestPaymentIntentId
                                    }
                                });
                                if (error) throw error;
                                rightFallbackBtn.innerText = `✓ Sent to ${email}`;
                                rightFallbackBtn.disabled = true;
                                const hintEl = document.getElementById('fallbackHint');
                                if (hintEl) {
                                    hintEl.innerHTML = `📧 Report sent to <strong>${email}</strong>. Check your inbox and spam folder.`;
                                    hintEl.style.display = 'block';
                                }
                            } catch (err) {
                                console.error('Email send failed:', err);
                                rightFallbackBtn.disabled = false;
                                rightFallbackBtn.innerText = stripHtml(t('sendEmailInstead'));
                                alert('Failed to send email. Please download instead.');
                            }
                        } else {
                            if (typeof generateTaxReport === 'function') generateTaxReport(userData, userLang);
                        }
                    });
                }
            }
            initPaymentCard();
            break;
    }
}