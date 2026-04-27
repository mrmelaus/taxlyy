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

            if (typeof setWelcomeCardActive === 'function') {
                setWelcomeCardActive(true);
            }
            break;

        case 'personal':
            // Name field
            const nameEl = document.getElementById('fullName');
            const nameError = document.getElementById('fullNameError');
            if (nameEl) {
                nameEl.addEventListener('input', (e) => {
                    let val = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
                    e.target.value = val;
                    userData.fullName = val;
                    saveCurrentData();
                    if (val.trim().length >= 2) {
                        nameEl.style.borderColor = 'var(--accent)';
                        if (nameError) nameError.style.display = 'none';
                    } else {
                        nameEl.style.borderColor = '';
                        if (nameError) nameError.style.display = 'none';
                    }
                });
                nameEl.addEventListener('blur', () => {
                    const val = nameEl.value.trim();
                    if (val.length < 2) {
                        nameEl.style.borderColor = 'var(--error)';
                        if (nameError) nameError.style.display = 'block';
                    } else {
                        nameEl.style.borderColor = 'var(--accent)';
                        if (nameError) nameError.style.display = 'none';
                    }
                });
            }

            // TFN field
            const tfnInput = document.getElementById('tfn');
            if (tfnInput) {
                tfnInput.value = formatTfnDisplay(userData.tfn || '');
                tfnInput.addEventListener('blur', () => {
                    const raw = getRawTfn(tfnInput.value);
                    tfnInput.value = formatTfnDisplay(raw);
                    userData.tfn = raw;
                    saveCurrentData();
                });
                tfnInput.addEventListener('focus', () => {
                    const raw = getRawTfn(tfnInput.value);
                    tfnInput.value = raw;
                });
                tfnInput.addEventListener('input', (e) => {
                    let raw = e.target.value.replace(/\D/g, '');
                    if (raw.length > 9) raw = raw.slice(0, 9);
                    userData.tfn = raw;
                    e.target.value = formatTfnDisplay(raw);
                    saveCurrentData();
                });
            }

            // DOB field
            const dobInput = document.getElementById('dob');
            const dobError = document.getElementById('dobError');
            if (dobInput) {
                dobInput.addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 8) value = value.slice(0, 8);
                    if (value.length >= 3) value = value.slice(0, 2) + '/' + value.slice(2);
                    if (value.length >= 6) value = value.slice(0, 5) + '/' + value.slice(5);
                    e.target.value = value;
                    userData.dob = value;
                    saveCurrentData();
                    if (dobError) dobError.style.display = 'none';
                    e.target.style.borderColor = '';
                });
                dobInput.addEventListener('blur', function(e) {
                    const value = e.target.value;
                    const isValid = validateDOB(value);
                    if (!isValid) {
                        if (dobError) {
                            dobError.textContent = 'Please enter a valid date in DD/MM/YYYY format (e.g., 31/12/1990)';
                            dobError.style.display = 'block';
                        }
                        e.target.style.borderColor = 'var(--error)';
                    } else {
                        if (dobError) dobError.style.display = 'none';
                        e.target.style.borderColor = 'var(--accent)';
                    }
                });
            }

            // Tax Resident radio (Yes/No)
            const taxResidentRadios = document.querySelectorAll('input[name="taxResident"]');
            const tempVisaGroup = document.getElementById('tempVisaGroup');
            const whmGroup = document.getElementById('whmGroup');

            // ====================================================
            // FIX 1: updateResidencyVisibility guard on first load
            //
            // BEFORE:
            //   const isResident = selected ? selected.value === 'yes' : false;
            //   userData.isAustralianTaxResident = isResident;
            //   — On first load with nothing checked, selected is null,
            //     isResident evaluates to false, and the function writes
            //     userData.isAustralianTaxResident = false, overwriting
            //     the correct `undefined` state that tells the calculator
            //     to skip all calculations until the user actually answers.
            //
            // AFTER:
            //   Guard with `if (!selected) return` so userData is only
            //   written when the user has actively made a selection.
            // ====================================================
            function updateResidencyVisibility() {
                const selected = document.querySelector('input[name="taxResident"]:checked');

                // FIX 1: do not write to userData until user has answered
                if (!selected) return;

                const isResident = selected.value === 'yes';
                userData.isAustralianTaxResident = isResident;
                saveCurrentData();

                if (tempVisaGroup) tempVisaGroup.style.display = isResident ? 'block' : 'none';
                if (whmGroup) whmGroup.style.display = isResident ? 'none' : 'block';

                // If switching to non-resident, clear temporary visa and medicare flags
                if (!isResident) {
                    userData.isTemporaryVisaHolder = undefined;
                    userData.hasMedicareExemptionCertificate = undefined;
                    const tempRadios = document.querySelectorAll('input[name="tempVisa"]');
                    tempRadios.forEach(r => r.checked = false);
                    const certRadios = document.querySelectorAll('input[name="medicareCert"]');
                    certRadios.forEach(r => r.checked = false);
                    const medicareCertGroup = document.getElementById('medicareCertGroup');
                    if (medicareCertGroup) medicareCertGroup.style.display = 'none';
                } else {
                    const tempSelected = document.querySelector('input[name="tempVisa"]:checked');
                    if (tempSelected) {
                        userData.isTemporaryVisaHolder = tempSelected.value === 'yes';
                        updateTempVisaVisibility();
                    }
                }

                // Update card highlight
                document.querySelectorAll('.tax-residency-card').forEach(card => {
                    card.classList.remove('selected');
                });
                if (selected) selected.closest('.tax-residency-card').classList.add('selected');
            }

            function updateTempVisaVisibility() {
                const selected = document.querySelector('input[name="tempVisa"]:checked');

                // FIX 1: do not write to userData until user has answered
                if (!selected) return;

                const isTemp = selected.value === 'yes';
                userData.isTemporaryVisaHolder = isTemp;
                saveCurrentData();

                const medicareCertGroup = document.getElementById('medicareCertGroup');
                if (medicareCertGroup) {
                    medicareCertGroup.style.display = isTemp ? 'block' : 'none';
                }
                if (!isTemp) {
                    userData.hasMedicareExemptionCertificate = undefined;
                    const certRadios = document.querySelectorAll('input[name="medicareCert"]');
                    certRadios.forEach(r => r.checked = false);
                }

                // Highlight selected card
                document.querySelectorAll('#tempVisaGroup .tax-residency-card').forEach(card => {
                    card.classList.remove('selected');
                });
                if (selected) selected.closest('.tax-residency-card').classList.add('selected');
            }

            function updateMedicareCert() {
                const selected = document.querySelector('input[name="medicareCert"]:checked');
                userData.hasMedicareExemptionCertificate = selected ? selected.value === 'yes' : false;
                saveCurrentData();
                document.querySelectorAll('#medicareCertGroup .tax-residency-card').forEach(card => {
                    card.classList.remove('selected');
                });
                if (selected) selected.closest('.tax-residency-card').classList.add('selected');
            }

            function updateWHM() {
                const selected = document.querySelector('input[name="whmVisa"]:checked');
                userData.isWHMVisaHolder = selected ? selected.value === 'yes' : false;
                saveCurrentData();
                document.querySelectorAll('#whmGroup .tax-residency-card').forEach(card => {
                    card.classList.remove('selected');
                });
                if (selected) selected.closest('.tax-residency-card').classList.add('selected');
            }

            if (taxResidentRadios.length) {
                taxResidentRadios.forEach(radio => {
                    radio.addEventListener('change', updateResidencyVisibility);
                });
                // Restore visibility state on load (guard inside prevents overwriting undefined)
                updateResidencyVisibility();
            }

            const tempVisaRadios = document.querySelectorAll('input[name="tempVisa"]');
            if (tempVisaRadios.length) {
                tempVisaRadios.forEach(radio => {
                    radio.addEventListener('change', updateTempVisaVisibility);
                });
                // Guard inside prevents overwriting undefined on load
                updateTempVisaVisibility();
            }

            const medicareCertRadios = document.querySelectorAll('input[name="medicareCert"]');
            if (medicareCertRadios.length) {
                medicareCertRadios.forEach(radio => {
                    radio.addEventListener('change', updateMedicareCert);
                });
                // FIX: restore card highlight on load if answer was previously saved
                updateMedicareCert();
            }

            const whmRadios = document.querySelectorAll('input[name="whmVisa"]');
            if (whmRadios.length) {
                whmRadios.forEach(radio => {
                    radio.addEventListener('change', updateWHM);
                });
                // FIX: restore card highlight on load if answer was previously saved
                updateWHM();
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
                        userData.employers.push(newEmployer);
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
                                userData.employers.push(newEmployer);
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
            const incomeCategories = [
                { id: 'interest', labelKey: 'interest', hasDescription: false },
                { id: 'dividends', labelKey: 'dividends', hasDescription: false },
                { id: 'other', labelKey: 'other', hasDescription: true }
            ];

            function renderOtherIncomeList() {
                const container = document.getElementById('otherIncomeList');
                if (!container) return;
                const oi = userData.otherIncome;
                let html = '';
                incomeCategories.forEach(cat => {
                    const isEditing = (oi._editing === cat.id);
                    let displayValue = '';
                    let displayDesc = '';
                    if (cat.id === 'other') {
                        displayValue = (oi.otherAmount || 0) === 0 ? t('notEntered') : formatCurrency(oi.otherAmount);
                        displayDesc = oi.otherDescription || t('notEntered');
                    } else {
                        displayValue = (oi[cat.id] || 0) === 0 ? t('notEntered') : formatCurrency(oi[cat.id]);
                    }
                    html += `
                        <div class="income-category-card" data-category="${cat.id}">
                            <div class="category-header">
                                <div class="category-name">${t(cat.labelKey)}</div>
                                <button class="category-edit-btn" data-category="${cat.id}">${t('edit')}</button>
                            </div>
                            ${!isEditing ? `
                                <div class="category-stats">
                                    ${cat.hasDescription ? `
                                        <span><span class="stat-label">${t('descriptionLabel')}:</span> <span class="stat-value">${escapeHtml(displayDesc)}</span></span>
                                        <span><span class="stat-label">${t('amountLabel')}:</span> <span class="stat-value">${displayValue}</span></span>
                                    ` : `
                                        <span><span class="stat-label">${t('amountLabel')}:</span> <span class="stat-value">${displayValue}</span></span>
                                    `}
                                </div>
                            ` : `
                                <div class="category-edit-form">
                                    ${cat.hasDescription ? `
                                        <div class="edit-field">
                                            <label>${t('descriptionLabel')}</label>
                                            <input type="text" class="edit-description" value="${escapeHtml(oi.otherDescription || '')}">
                                        </div>
                                    ` : ''}
                                    <div class="edit-field">
                                        <label>${t('amountLabel')}</label>
                                        <input type="number" class="edit-amount" value="${cat.id === 'other' ? (oi.otherAmount || 0) : (oi[cat.id] || 0)}" step="any" min="0">
                                    </div>
                                    <div class="edit-actions">
                                        <button class="update-btn" data-category="${cat.id}">${t('update')}</button>
                                        <button class="cancel-btn" data-category="${cat.id}">${t('cancel')}</button>
                                    </div>
                                </div>
                            `}
                        </div>
                    `;
                });
                container.innerHTML = html;

                document.querySelectorAll('.category-edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        userData.otherIncome._editing = btn.dataset.category;
                        renderOtherIncomeList();
                    });
                });
                document.querySelectorAll('.update-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const catId = btn.dataset.category;
                        const cardDiv = btn.closest('.income-category-card');
                        const amount = parseFloat(cardDiv.querySelector('.edit-amount').value) || 0;
                        if (amount < 0) { alert('Amount cannot be negative.'); return; }
                        if (catId === 'other') {
                            const descInput = cardDiv.querySelector('.edit-description');
                            userData.otherIncome.otherDescription = descInput ? descInput.value : '';
                            userData.otherIncome.otherAmount = amount;
                        } else {
                            userData.otherIncome[catId] = amount;
                        }
                        delete userData.otherIncome._editing;

                        renderOtherIncomeList();
                        if (typeof updateEstimateAndDisplay === 'function') updateEstimateAndDisplay(userData);
                        saveCurrentData();
                    });
                });
                document.querySelectorAll('.cancel-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        delete userData.otherIncome._editing;
                        renderOtherIncomeList();
                    });
                });
            }

            renderOtherIncomeList();
            if (typeof setupUploadListeners === 'function') setupUploadListeners();
            renderEmployerList();
            break;

        case 'deductions':
            const deductionItems = [
                {
                    id: 'homeOffice',
                    labelKey: 'homeOffice',
                    hintKey: 'homeOfficeHint',
                    renderDisplay: (data) => {
                        const hours = data.homeOfficeHours || 0;
                        const deduction = hours * 0.70;
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
                            <div class="calculated-value">${formatCurrency((data.homeOfficeHours || 0) * 0.70)}</div>
                        </div>
                    `,
                    update: (cardDiv) => {
                        const hours = parseFloat(cardDiv.querySelector('.edit-homeOffice-hours')?.value) || 0;
                        userData.homeOfficeHours = hours;
                        userData.homeOfficeDeduction = hours * 0.70;
                        userData.homeOffice = hours * 0.70;
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
                            return `Cents per km: ${km} km → ${formatCurrency(Math.min(km, 5000) * 0.88)}`;
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
                            deduction = km * 0.88;
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
                        const over300 = data.equipmentOver300 || 0;
                        return `Under $300: ${formatCurrency(under300)} | Over $300: ${formatCurrency(over300)}`;
                    },
                    renderEdit: (data) => `
                        <div class="edit-field">
                            <label>${t('equipmentUnder300')}</label>
                            <input type="number" class="edit-equipment-under" value="${data.equipmentUnder300 || 0}" step="any" min="0">
                        </div>
                        <div class="edit-field">
                            <label>${t('equipmentOver300')}</label>
                            <input type="number" class="edit-equipment-over" value="${data.equipmentOver300 || 0}" step="any" min="0">
                        </div>
                    `,
                    update: (cardDiv) => {
                        const under300 = parseFloat(cardDiv.querySelector('.edit-equipment-under')?.value) || 0;
                        const over300 = parseFloat(cardDiv.querySelector('.edit-equipment-over')?.value) || 0;
                        userData.equipmentUnder300 = under300;
                        userData.equipmentOver300 = over300;
                        userData.equipment = under300;
                        return true;
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
                        saveCurrentData();
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

                container.innerHTML = html;

                document.querySelectorAll('.category-edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        userData._editingAdj = btn.dataset.item;
                        renderAdjustmentsList();
                    });
                });
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
                        } else {
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
                        saveCurrentData();
                        renderAdjustmentsList();
                    });
                });
                document.querySelectorAll('.cancel-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        delete userData._editingAdj;
                        renderAdjustmentsList();
                    });
                });
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
                        return data.isSingle ? t('familySingle') : t('familyCouple');
                    },
                    renderEdit: (data) => `
                        <div class="radio-group">
                            <label><input type="radio" name="familyStatus" value="single" ${data.isSingle === true ? 'checked' : ''}> ${t('familySingle')}</label>
                            <label><input type="radio" name="familyStatus" value="couple" ${data.isSingle === false ? 'checked' : ''}> ${t('familyCouple')}</label>
                        </div>
                    `,
                    update: (cardDiv) => {
                        const selected = cardDiv.querySelector('input[name="familyStatus"]:checked')?.value;
                        if (!selected) return false;
                        userData.isSingle = (selected === 'single');
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
                        if (data.phiRebateMethod === 'taxtime') return `${t('phiRebateTaxTime')} (${t('phiRebateTier' + data.phiRebateTier)})`;
                        return t('phiRebateNone');
                    },
                    renderEdit: (data) => {
                        const method = data.phiRebateMethod || '';
                        const tier = data.phiRebateTier || 1;
                        return `
                            <div class="radio-group">
                                <label><input type="radio" name="rebateMethod" value="upfront" ${method === 'upfront' ? 'checked' : ''}> ${t('phiRebateUpfront')}</label>
                                <label><input type="radio" name="rebateMethod" value="taxtime" ${method === 'taxtime' ? 'checked' : ''}> ${t('phiRebateTaxTime')}</label>
                                <label><input type="radio" name="rebateMethod" value="none" ${method === 'none' ? 'checked' : ''}> ${t('phiRebateNone')}</label>
                            </div>
                            <div class="tier-fields" style="display: ${method === 'taxtime' ? 'block' : 'none'}">
                                <div class="radio-group">
                                    <label><input type="radio" name="rebateTier" value="1" ${tier === 1 ? 'checked' : ''}> ${t('phiRebateTier1')}</label>
                                    <label><input type="radio" name="rebateTier" value="2" ${tier === 2 ? 'checked' : ''}> ${t('phiRebateTier2')}</label>
                                    <label><input type="radio" name="rebateTier" value="3" ${tier === 3 ? 'checked' : ''}> ${t('phiRebateTier3')}</label>
                                </div>
                            </div>
                        `;
                    },
                    update: (cardDiv) => {
                        const method = cardDiv.querySelector('input[name="rebateMethod"]:checked')?.value;
                        if (!method) return false;
                        userData.phiRebateMethod = method;
                        if (method === 'taxtime') {
                            const tierRadio = cardDiv.querySelector('input[name="rebateTier"]:checked');
                            userData.phiRebateTier = tierRadio ? parseInt(tierRadio.value) : 1;
                        } else {
                            userData.phiRebateTier = 0;
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
                        saveCurrentData();
                        renderHealthList();
                    });
                });
                document.querySelectorAll('.cancel-btn').forEach(btn => {
                    btn.addEventListener('click', () => { delete userData._editingHealth; renderHealthList(); });
                });

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

                const rebateRadios = document.querySelectorAll('input[name="rebateMethod"]');
                if (rebateRadios.length) {
                    const updateTierField = () => {
                        const selected = document.querySelector('input[name="rebateMethod"]:checked')?.value;
                        const tierField = document.querySelector('.tier-fields');
                        if (tierField) tierField.style.display = selected === 'taxtime' ? 'block' : 'none';
                    };
                    rebateRadios.forEach(r => r.addEventListener('change', updateTierField));
                    updateTierField();
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
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            });
            break;

        case 'declaration':
            let selectedMethod = null;
            const deliveryCards = document.querySelectorAll('.delivery-card');
            const emailField = document.querySelector('.delivery-email-field');

            deliveryCards.forEach(card => {
                card.addEventListener('click', () => {
                    deliveryCards.forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    selectedMethod = card.dataset.method;
                    if (emailField) emailField.style.display = selectedMethod === 'email' ? 'block' : 'none';
                    userData.deliveryMethod = selectedMethod;
                    saveCurrentData();
                });
            });

            if (userData.deliveryMethod) {
                const savedCard = document.querySelector(`.delivery-card[data-method="${userData.deliveryMethod}"]`);
                if (savedCard) savedCard.click();
            }

            const emailInput = document.getElementById('userEmail');
            if (emailInput) {
                emailInput.addEventListener('input', (e) => {
                    userData.email = e.target.value.trim();
                    saveCurrentData();
                });
            }

            const bilingualCheckbox = document.getElementById('bilingualReportCheckbox');
            if (bilingualCheckbox) {
                bilingualCheckbox.addEventListener('change', (e) => {
                    userData.bilingualReport = e.target.checked;
                    saveCurrentData();
                });
            }
            break;

        case 'payment':
            function initPaymentCard() {
                let currentTotal = (userData.employers || []).length > 1
                    ? (window.pricing.multiple_jobs_fee || 79.99)
                    : (window.pricing.standard_fee || 69.99);
                let discountAmount = 0;
                let appliedPromo = null;

                if (userData.appliedPromo) {
                    appliedPromo = userData.appliedPromo;
                    discountAmount = appliedPromo.discount;
                    userData.promoCode = userData.appliedPromo.code;
                    userData.discountAmount = discountAmount;
                    const baseFee = (userData.employers || []).length > 1
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

                        let discount = null;
                        if (typeof validatePromoCode === 'function') {
                            discount = await validatePromoCode(code);
                        }

                        if (discount !== null && discount > 0) {
                            discountAmount = discount;
                            appliedPromo = { code, discount };
                            userData.appliedPromo = appliedPromo;
                            userData.promoCode = code;
                            userData.discountAmount = discountAmount;
                            const baseFee = (userData.employers || []).length > 1
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
                            }
                            updatePayButton();
                            if (typeof initStripePayment === 'function') {
                                initStripePayment(currentTotal);
                            }
                        } else {
                            if (promoMessage) {
                                promoMessage.innerHTML = t('promoInvalid');
                                promoMessage.className = 'promo-message error';
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
                        currentCardIndex = 0;
                        renderCard();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    });
                }

                const leftFallbackBtn = document.getElementById('fallbackLeftBtn');
                const rightFallbackBtn = document.getElementById('fallbackRightBtn');

                if (leftFallbackBtn) {
                    leftFallbackBtn.addEventListener('click', () => {
                        const userLang = window.currentLang === 'zh' ? 'zh' : 'en';
                        if ((userData.deliveryMethod || 'download') === 'download') {
                            if (typeof generateTaxReport === 'function') generateTaxReport(userData, userLang);
                        } else {
                            alert(t('emailResendPending') || 'Email resend coming soon.');
                        }
                    });
                }

                if (rightFallbackBtn) {
                    rightFallbackBtn.addEventListener('click', () => {
                        const userLang = window.currentLang === 'zh' ? 'zh' : 'en';
                        if ((userData.deliveryMethod || 'download') === 'download') {
                            const email = prompt(stripHtml(t('emailPrompt')) || 'Please enter your email address:');
                            if (email && email.includes('@')) {
                                userData.email = email;
                                saveCurrentData();
                                alert(`${stripHtml(t('reportSentTo') || 'Report will be sent to')} ${email}`);
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