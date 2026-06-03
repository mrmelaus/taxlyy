// render-cards.js
// ========================================
// Card HTML generation
// ========================================

// Alias so review card works without rewriting every call
function formatMoney(amount) {
    return formatCurrency(amount);
}

function getCardHtml(cardId) {
    switch(cardId) {

        case 'welcome':
        return `
            <div class="welcome-wrap">

                <div class="welcome-tagline">${t('welcomeTagline')}</div>

                <div class="welcome-trust-row">
                    <div class="trust-badge">✦ <span>${t('trustAto')}</span></div>
                    <div class="trust-badge">🔒 <span>${t('trustPrivacy')}</span></div>
                    <div class="trust-badge">⚡ <span>${t('trustAi')}</span></div>
                    <div class="trust-badge">🇦🇺 <span>${t('trustMade')}</span></div>
                </div>

                <div class="welcome-section">
                    <div class="welcome-section-title">${t('welcomeNeedTitle')}</div>
                    <ul class="welcome-checklist">
                        <li>✦ ${t('needTfn')}</li>
                        <li>✦ ${t('needPayslip')}</li>
                        <li>✦ ${t('needHealth')}</li>
                    </ul>
                </div>

                <div class="welcome-section">
                    <div class="welcome-section-title">${t('welcomeDeadlineTitle')}</div>
                    <div class="welcome-deadline-box">
                        <div class="deadline-row">
                            <span class="deadline-icon">📅</span>
                            <span>${t('welcomeDeadline')}</span>
                        </div>
                        <div class="deadline-row disclaimer-payg">
                            <span class="deadline-icon">⚠️</span>
                            <span>${t('paygOnlyDisclaimer')}</span>
                        </div>
                    </div>
                </div>

                <div class="welcome-section">
                    <div class="welcome-section-title">${t('welcomeFeeTitle')}</div>
                    <div class="welcome-fee-row">
                      <div class="fee-card">
                            <div class="fee-label">${t('feeCardSingle')}</div>
                            <div class="fee-amount">$${window.pricing.standard_fee}</div>
                            <div class="fee-desc">${t('feeCardSingleDesc')}</div>
                        </div>
                        <div class="fee-card">
                            <div class="fee-label">${t('feeCardMultiple')}</div>
                            <div class="fee-amount">$${window.pricing.multiple_jobs_fee}</div>
                            <div class="fee-desc">${t('feeCardMultipleDesc')}</div>
                        </div>
                        <div class="fee-card fee-card-highlight">
                            <div class="fee-label">${t('feeCardAbn')}</div>
                            <div class="fee-amount">$${window.pricing.abn_fee}</div>
                            <div class="fee-desc">${t('feeCardAbnDesc')}</div>
                        </div>
                    </div>
                    <small class="fee-note">${t('feePromo')}</small>
                </div>

                <div class="welcome-consent">
                    <label class="checkbox-group">
                        <input type="checkbox" id="consentCheckbox">
                        <span>${t('consentText')} <button class="link-btn" id="openLegal">${t('consentLink')}</button></span>
                    </label>
                </div>

                <div class="welcome-time">
                    ⏱ ${t('welcomeTime')}
                </div>

            </div>

            <!-- Legal Modal -->
            <div class="legal-overlay" id="legalOverlay" style="display:none;">
                <div class="legal-modal">
                    <button class="legal-close" id="closeLegal">✕</button>
                    <div class="legal-content">
                        <h2>${t('legalTitle')}</h2>
                        <p class="legal-company">Taxlyy Individual is a product of <strong>Hepta Care Pty Ltd</strong> ABN 73 666 661 338</p>

                        <h3>1. About Taxlyy</h3>
                        <p>Taxlyy Individual is an AI-powered tax return report tool designed to help Australians prepare and understand their individual tax return. Taxlyy is a technology tool and is not a registered tax agent under the Tax Agent Services Act 2009. The information and calculations provided are estimates only and should not be relied upon as professional tax advice.</p>

                        <h3>2. Your Obligations</h3>
                        <p>You are solely responsible for the accuracy and completeness of the information you provide. You must ensure all income, deductions, and personal details are correct. Submitting incorrect information to the ATO may result in penalties. Taxlyy accepts no liability for errors arising from incorrect information provided by the user.</p>

                        <h3>3. Privacy & Data</h3>
                        <p>Taxlyy does not permanently store your personal information or tax data. All information entered is held in your browser session only and is cleared when you close or refresh the page. We do not share your information with third parties except as required to process your payment securely via Stripe.</p>

                        <h3>4. Cookies</h3>
                        <p>Taxlyy uses session storage only to maintain your progress through the return process. We do not use tracking cookies or advertising cookies. No personal data is transmitted to analytics platforms.</p>

                        <h3>5. Fees & Payment</h3>
                        <p>Taxlyy Individual is for PAYG employees only. A flat fee of <strong>$${window.pricing.standard_fee}</strong> applies if you have income from a single employer. If you have income from two or more employers, the fee is <strong>$${window.pricing.multiple_jobs_fee}</strong>. All fees are in Australian Dollars (AUD), include GST, and are processed securely via Stripe. No refunds are provided.</p>

                        <h3>6. No Refund Policy</h3>
                        <p>All sales are final. Once your tax return report has been generated and delivered, no refund will be issued. By proceeding to payment, you acknowledge that you have reviewed your return and agree to this policy.</p>

                        <h3>7. ATO Disclaimer</h3>
                        <p>Calculations are based on the official ATO tax rates and thresholds for the current financial year. These are estimates only. Your actual tax liability may differ based on your individual circumstances. Always verify your return with the ATO or a registered tax agent if you are unsure.</p>

                        <h3>8. Lodgement Deadline</h3>
                        <p>The ATO individual tax return lodgement deadline is 31 October each year. It is your responsibility to ensure your return is lodged on time. Taxlyy is not responsible for any penalties arising from late lodgement.</p>

                        <h3>9. Contact</h3>
                        <p>For support, contact Hepta Care Pty Ltd at <strong>support@taxlyy.com.au</strong></p>

                        <button class="accept-continue-btn" id="closeLegalBtn">${t('legalClose')}</button>
                    </div>
                </div>
            </div>
        `;

        case 'personal':
        return `
            <div id="personalCardError" class="warning-box error" style="display:none; align-items:center; gap:8px;"></div>

            <div class="form-group">
                <div class="form-label-bilingual">${t('nameLabel')}</div>
                <input type="text" id="fullName" class="form-input"
                    value="${escapeHtml(userData.fullName || '')}"
                    placeholder="${escapeHtml(stripHtml(t('namePlaceholder')))}"
                    maxlength="60"
                    autocomplete="name">
                <small class="form-error" id="fullNameError" style="display:none;">
                    ⚠ ${t('nameError')}
                </small>
            </div>

            <div class="form-group">
                <div class="form-label-bilingual">${t('tfnLabel')}</div>
                <input type="text" id="tfn" class="form-input"
                    value="${formatTfnDisplay(userData.tfn || '')}"
                    placeholder="123 456 789"
                    maxlength="11"
                    inputmode="numeric"
                    autocomplete="off">
                <small class="form-note">${t('tfnNote')}</small>
                <small class="form-error" id="tfnError" style="display:none;">
                    ⚠ ${t('tfnErrorText')}
                </small>
            </div>

            <div class="form-group">
                <div class="form-label-bilingual">${t('dobLabel')}</div>
                <input type="text" id="dob" class="form-input"
                    value="${userData.dob || ''}"
                    placeholder="DD/MM/YYYY"
                    maxlength="10"
                    inputmode="numeric">
                <small class="form-error" id="dobError" style="display:none;">
                    ⚠ ${t('dobErrorText')}
                </small>
            </div>

            <div class="form-group">
                <label for="email">${t('emailLabel')}</label>
                <input type="email" id="email" class="form-input"
                    value="${escapeHtml(userData.email || '')}"
                    placeholder="name@example.com">
                <div class="field-hint">${t('emailHint')}</div>
                <div id="emailError" class="form-error" style="display:none;">${t('emailErrorText')}</div>
            </div>

            <!-- Q1: Visa type -->
            <div class="form-group">
                <div class="form-label-bilingual">${t('visaTypeLabel')}</div>
                <div class="tax-residency-group" id="visaTypeGroup">

                    <label class="tax-residency-card ${userData.visaType === 'citizen_pr' ? 'selected' : ''}">
                        <input type="radio" name="visaType" value="citizen_pr" ${userData.visaType === 'citizen_pr' ? 'checked' : ''}>
                        <div class="tax-residency-title">${t('visaTypeCitizenPr')}</div>
                        <div class="tax-residency-desc">${t('visaTypeCitizenPrDesc')}</div>
                    </label>

                    <label class="tax-residency-card ${userData.visaType === 'temp_visa' ? 'selected' : ''}">
                        <input type="radio" name="visaType" value="temp_visa" ${userData.visaType === 'temp_visa' ? 'checked' : ''}>
                        <div class="tax-residency-title">${t('visaTypeTempVisa')}</div>
                        <div class="tax-residency-desc">${t('visaTypeTempVisaDesc')}</div>
                    </label>

                    <label class="tax-residency-card ${userData.visaType === 'whm' ? 'selected' : ''}">
                        <input type="radio" name="visaType" value="whm" ${userData.visaType === 'whm' ? 'checked' : ''}>
                        <div class="tax-residency-title">${t('visaTypeWhm')}</div>
                        <div class="tax-residency-desc">${t('visaTypeWhmDesc')}</div>
                    </label>

                </div>
            </div>

            <!-- Q2: Tax residency — shown for temp_visa and whm -->
            <div id="taxResidentGroup" style="display:${(userData.visaType === 'temp_visa' || userData.visaType === 'whm') ? 'block' : 'none'};">
                <div class="form-group">
                    <div class="form-label-bilingual">${t('taxResidentLabel')}</div>
                    <div class="tax-residency-group">
                        <label class="tax-residency-card ${userData.isTaxResident === true ? 'selected' : ''}">
                            <input type="radio" name="isTaxResident" value="yes" ${userData.isTaxResident === true ? 'checked' : ''}>
                            <div class="tax-residency-title">${t('taxResidentYes')}</div>
                            <div class="tax-residency-desc">${t('taxResidentYesDesc')}</div>
                        </label>
                        <label class="tax-residency-card ${userData.isTaxResident === false ? 'selected' : ''}">
                            <input type="radio" name="isTaxResident" value="no" ${userData.isTaxResident === false ? 'checked' : ''}>
                            <div class="tax-residency-title">${t('taxResidentNo')}</div>
                            <div class="tax-residency-desc">${t('taxResidentNoDesc')}</div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Q3a: Medicare cert — shown for temp_visa + tax resident -->
            <div id="medicareCertGroup" style="display:${(userData.visaType === 'temp_visa' && userData.isTaxResident === true) ? 'block' : 'none'};">
                <div class="form-group">
                    <div class="form-label-bilingual">${t('medicareCertLabel')}</div>
                    <div class="tax-residency-group">
                        <label class="tax-residency-card ${userData.hasMedicareExemptCert === true ? 'selected' : ''}">
                            <input type="radio" name="medicareCert" value="yes" ${userData.hasMedicareExemptCert === true ? 'checked' : ''}>
                            <div class="tax-residency-title">${t('medicareCertYes')}</div>
                            <div class="tax-residency-desc">${t('medicareCertYesDesc')}</div>
                        </label>
                        <label class="tax-residency-card ${userData.hasMedicareExemptCert === false ? 'selected' : ''}">
                            <input type="radio" name="medicareCert" value="no" ${userData.hasMedicareExemptCert === false ? 'checked' : ''}>
                            <div class="tax-residency-title">${t('medicareCertNo')}</div>
                            <div class="tax-residency-desc">${t('medicareCertNoDesc')}</div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Q3b: NDA country — shown for whm + tax resident -->
            <div id="ndaCountryGroup" style="display:${(userData.visaType === 'whm' && userData.isTaxResident === true) ? 'block' : 'none'};">
                <div class="form-group">
                    <div class="form-label-bilingual">${t('ndaCountryLabel')}</div>
                    <div class="tax-residency-group">
                        <label class="tax-residency-card ${userData.isNdaCountry === true ? 'selected' : ''}">
                            <input type="radio" name="ndaCountry" value="yes" ${userData.isNdaCountry === true ? 'checked' : ''}>
                            <div class="tax-residency-title">${t('ndaCountryYes')}</div>
                            <div class="tax-residency-desc">${t('ndaCountryYesDesc')}</div>
                        </label>
                        <label class="tax-residency-card ${userData.isNdaCountry === false ? 'selected' : ''}">
                            <input type="radio" name="ndaCountry" value="no" ${userData.isNdaCountry === false ? 'checked' : ''}>
                            <div class="tax-residency-title">${t('ndaCountryNo')}</div>
                            <div class="tax-residency-desc">${t('ndaCountryNoDesc')}</div>
                        </label>
                    </div>
                    <div class="warning-box info" style="margin-top:var(--space-3); display:${userData.isNdaCountry === true ? 'flex' : 'none'};" id="ndaWarnBox">
                        <span class="warning-box-icon">ℹ️</span>
                        <span class="warning-box-text">${t('ndaCountryWarnText')}</span>
                    </div>
                </div>
            </div>
        `;

        case 'income':
        return `
            <div style="display:flex; flex-direction:column; width:100%;">
                <div class="income-two-col">
                    <div class="income-card">
                        <div class="income-card-header">
                            <div class="income-card-icon">📁</div>
                            <div class="income-card-title">${t('uploadPayslip')}</div>
                        </div>
                        <div class="upload-zone" id="uploadZone">
                            <div class="upload-drag-hint">${t('uploadHint')}</div>
                            <input type="file" id="payslipInput" accept=".pdf,.jpg,.jpeg,.png" style="display:none">
                        </div>
                        <div class="upload-note">${t('finalPayslipHint')}</div>
                    </div>
                    <div class="income-card">
                        <div class="income-card-header">
                            <div class="income-card-icon">🔍</div>
                            <div class="income-card-title">${t('manualEntryTitle')}</div>
                        </div>
                        <div class="search-employer">
                            <div class="search-label">${t('searchEmployer')}</div>
                            <div class="search-row">
                                <input type="text" id="employerSearchInput" class="form-input"
                                    placeholder="${stripHtml(t('abnOrBusinessName'))}"
                                    autocomplete="off">
                                <button id="lookupEmployerBtn" class="nav-btn secondary">${stripHtml(t('lookup'))}</button>
                            </div>
                            <div id="lookupStatus" class="form-note"></div>
                            <div class="manual-hint">${t('manualEntryHint')}</div>
                        </div>
                    </div>
                </div>

                <div class="employers-section">
                    <div class="employers-header">${t('employersAdded')}</div>
                    <div id="employersListContainer" class="employers-list"></div>
                    <div class="add-employer-hint">${t('addEmployerHint')}</div>
                    <div class="warning-ato">
                        <span class="warning-ato-icon">⚠️</span>
                        <span class="warning-ato-text">${t('warningMatchAto')}</span>
                    </div>
                </div>

                <div class="other-income-section">
                    <div class="card-title">${t('otherIncomeTitle')}</div>
                    <div id="otherIncomeList" class="other-income-list"></div>
                </div>
            </div>
        `;

        case 'adjustments':
            if (userData.fringeBenefits === undefined) userData.fringeBenefits = 0;
            if (userData.reportableSuper === undefined) userData.reportableSuper = 0;
            if (userData.taxFreeGovPayments === undefined) userData.taxFreeGovPayments = 0;
            if (userData.targetForeignIncome === undefined) userData.targetForeignIncome = 0;
            if (userData.financialInvestmentLoss === undefined) userData.financialInvestmentLoss = 0;
            if (userData.childSupportPaid === undefined) userData.childSupportPaid = 0;
            if (userData.dependentChildren === undefined) userData.dependentChildren = 0;
            if (userData.rentalIncome === undefined) userData.rentalIncome = 0;
            if (userData.rentalExpenses === undefined) userData.rentalExpenses = 0;
            // HECS fields – do NOT default to false; keep undefined so user must answer
            if (userData.hasHecsLoan === undefined) userData.hasHecsLoan = undefined; // leave undefined
            if (userData.hecsManualRepaymentIncome === undefined) userData.hecsManualRepaymentIncome = 0;

            return `
                <div class="adjustments-intro">${t('adjustmentsIntro')}</div>
                <div id="adjustmentsList" class="other-income-list"></div>
            `;

        case 'deductions':
            if (userData.homeOfficeHours === undefined) userData.homeOfficeHours = 0;
            if (userData.homeOfficeDeduction === undefined) userData.homeOfficeDeduction = 0;
            if (userData.travelKilometres === undefined) userData.travelKilometres = 0;
            if (userData.travelLogbookExpenses === undefined) userData.travelLogbookExpenses = 0;
            if (userData.travelLogbookPercent === undefined) userData.travelLogbookPercent = 0;
            if (userData.travelMethod === undefined) userData.travelMethod = 'cents';
            if (userData.travelExpenses === undefined) userData.travelExpenses = 0;
            if (userData.equipmentUnder300 === undefined) userData.equipmentUnder300 = 0;
            if (userData.equipmentOver300 === undefined) userData.equipmentOver300 = 0;
            if (userData.equipment === undefined) userData.equipment = 0;
            if (userData.selfEducation === undefined) userData.selfEducation = 0;
            if (userData.otherDeductions === undefined) userData.otherDeductions = 0;
            return `
                <div class="deductions-intro">${t('deductionsIntro')}</div>
                <div id="deductionsList" class="other-income-list"></div>
            `;

        case 'health':
            return `
                <div class="health-intro">${t('privateHealthIntro')}</div>
                <div id="healthList" class="other-income-list"></div>
            `;

        case 'review':
            const calculation = calculateRefund(userData);

            const getResidencyText = () => {
                const status = getEffectiveTaxStatus(userData);
                const map = {
                    'australian':        t('residentOptionAustralian'),
                    'resident_exempt':   t('residentOptionResidentExempt'),
                    'whm':               t('residentOptionWhm'),
                    'whm_nda_resident':  t('residentOptionWhmNda'),
                    'foreign':           t('residentOptionForeign')
                };
                return map[status] || t('residentOptionAustralian');
            };
            const getCoverText = () => {
                if (userData.hasPrivateHospitalCover === false) return t('coverStatusNo');
                if (userData.daysWithoutCover === 0) return t('coverStatusYes');
                return `${t('coverStatusYesPartial')} (${userData.daysWithoutCover} ${t('daysWithoutCover')})`;
            };

            const getRebateText = () => {
                const method = userData.phiRebateMethod || 'upfront';
                if (method === 'upfront') return t('phiRebateUpfront');
                if (method === 'taxtime') return t('phiRebateTaxTime');
                return t('phiRebateNone');
            };

            let employersHtml = '';
            if (userData.employers && userData.employers.length > 0) {
                userData.employers.forEach(emp => {
                    employersHtml += `
                        <div class="review-employer-item">
                            <div class="review-employer-name">${escapeHtml(emp.employerName || 'Unknown')}</div>
                            ${emp.employerAbn ? `<div class="review-employer-abn">ABN: ${escapeHtml(emp.employerAbn)}</div>` : ''}
                            <div class="review-employer-stats">${formatMoney(emp.grossIncome)} income, ${formatMoney(emp.taxWithheld)} tax withheld</div>
                        </div>
                    `;
                });
                const totalIncome = userData.employers.reduce((sum, e) => sum + (e.grossIncome || 0), 0);
                const totalWithheld = userData.employers.reduce((sum, e) => sum + (e.taxWithheld || 0), 0);
                employersHtml += `<div class="review-subtotal">Total: ${formatMoney(totalIncome)} income, ${formatMoney(totalWithheld)} tax withheld</div>`;
            } else {
                employersHtml = `<div class="review-empty">${t('noEmployersYet')}</div>`;
            }

            const oi = userData.otherIncome || {};

            // Calculate derived values
            const grossedUpDividends = (oi.dividends || 0) + (userData.frankingCredits || 0);
            const abnNet = (userData.abnIncome || 0) - (userData.abnExpenses || 0);
            const netCapitalGain = Math.max(0, 
                (userData.capitalGains || 0) - 
                (userData.capitalLosses || 0) - 
                (userData.priorYearCapitalLosses || 0)
            );

            const otherIncomeHtml = `
                <div class="review-subitem"><strong>${t('interest')}</strong>: ${formatMoney(oi.interest || 0)}</div>
                
                <div class="review-subitem"><strong>${t('dividends')}</strong></div>
                <div class="review-subitem">${t('cashDividends')}: ${formatMoney(oi.dividends || 0)}</div>
                <div class="review-subitem">${t('frankingCredits')}: ${formatMoney(userData.frankingCredits || 0)}</div>
                <div class="review-subitem"><strong>${t('grossedUpTotal')}: ${formatMoney(grossedUpDividends)}</strong></div>
                
                <div class="review-subitem"><strong>${t('governmentPayments')}</strong></div>
                <div class="review-subitem">${t('taxablePayments')}: ${formatMoney(userData.governmentPayments || 0)}</div>
                <div class="review-subitem">${t('taxWithheld')}: ${formatMoney(userData.govTaxWithheld || 0)}</div>
                
                <div class="review-subitem"><strong>${t('abnSoleTraderIncome')}</strong></div>
                <div class="review-subitem">${t('totalAbnIncome')}: ${formatMoney(userData.abnIncome || 0)}</div>
                <div class="review-subitem">${t('totalBusinessExpenses')}: ${formatMoney(userData.abnExpenses || 0)}</div>
                <div class="review-subitem"><strong>${t('netAbnProfitLoss')}: ${formatMoney(abnNet)}</strong></div>
                <div class="review-subitem">${t('taxWithheldOnAbn')}: ${formatMoney(userData.abnTaxWithheld || 0)}</div>
                ${abnNet < 0 ? `<div class="warning-ato">${t('abnLossRecorded', { amount: formatMoney(Math.abs(abnNet)) })}</div>` : ''}
                
                <div class="review-subitem"><strong>${t('capitalGains')}</strong></div>
                <div class="review-subitem">${t('grossCapitalGains')}: ${formatMoney(userData.capitalGains || 0)}</div>
                <div class="review-subitem">${t('capitalLossesCurrent')}: ${formatMoney(userData.capitalLosses || 0)}</div>
                <div class="review-subitem">${t('priorYearLosses')}: ${formatMoney(userData.priorYearCapitalLosses || 0)}</div>
                <div class="review-subitem"><strong>${t('netCapitalGain')}: ${formatMoney(netCapitalGain)}</strong></div>
                ${userData.cgtDiscountApplies ? `<div class="review-subitem">${t('cgtDiscountApplied')} ✓</div>` : ''}
                
                <div class="review-subitem"><strong>${t('other')}</strong>: ${formatMoney(oi.otherAmount || 0)}${oi.otherDescription ? ` (${escapeHtml(oi.otherDescription)})` : ''}</div>
            `;

            const deductionsHtml = `
                <div class="review-subitem">${t('homeOffice')}: ${formatMoney(userData.homeOffice || 0)}</div>
                <div class="review-subitem">${t('travelExpenses')}: ${formatMoney(userData.travelExpenses || 0)}</div>
                <div class="review-subitem">${t('equipment')}: ${formatMoney(userData.equipment || 0)}</div>
                <div class="review-subitem">${t('selfEducation')}: ${formatMoney(userData.selfEducation || 0)}</div>
                <div class="review-subitem">${t('otherDeductions')}: ${formatMoney(userData.otherDeductions || 0)}</div>
                <div class="review-subtotal">${t('totalDeductions')}: ${formatMoney(userData.totalDeductions || 0)}</div>
            `;

           const adjustmentsHtml = `
                <div class="review-subitem">${t('fringeBenefits')}: ${formatMoney(userData.fringeBenefits || 0)}</div>
                <div class="review-subitem">${t('reportableSuper')}: ${formatMoney(userData.reportableSuper || 0)}</div>
                <div class="review-subitem">${t('financialInvestmentLoss')}: ${formatMoney(userData.financialInvestmentLoss || 0)}</div>
                <div class="review-subitem">${t('childSupportPaid')}: ${formatMoney(userData.childSupportPaid || 0)}</div>
                <div class="review-subitem">${t('dependentChildren')}: ${userData.dependentChildren || 0}</div>
                <div class="review-subitem">${t('rentalProperty')}: ${formatMoney(userData.rentalPropertyLoss || 0)}</div>
                ${userData.hasHecsLoan !== undefined ? `
                    <div class="review-subitem">${t('hecsLoanLabel')}: ${userData.hasHecsLoan ? t('hecsYes') : t('hecsNo')}
                    ${userData.hasHecsLoan && userData.hecsManualRepaymentIncome > 0 ? ` (${t('hecsManualIncome')}: ${formatMoney(userData.hecsManualRepaymentIncome)})` : ''}
                    </div>
                ` : ''}
            `;

            const healthHtml = `
                <div class="review-subitem">${t('hospitalCover')}: ${getCoverText()}</div>
                <div class="review-subitem">${t('familySituation')}: ${userData.isSingle ? t('familySingle') : t('familyCouple')}</div>
                <div class="review-subitem">${t('phiRebate')}: ${getRebateText()}</div>
            `;

            return `
                <div class="review-container">
                    <div class="review-section">
                        <div class="review-section-header">
                            <div class="review-section-title">${t('personalInfo')}</div>
                            <button class="review-edit-btn" data-card="personal">${t('edit')}</button>
                        </div>
                        <div class="review-content">
                            <div class="review-subitem">${t('nameLabel')}: ${escapeHtml(userData.fullName || '—')}</div>
                            <div class="review-subitem">${t('tfnLabel')}: ${userData.tfn ? '••• ••• ' + userData.tfn.slice(-3) : '—'}</div>
                            <div class="review-subitem">${t('dobLabel')}: ${userData.dob || '—'}</div>
                            <div class="review-subitem">${t('residentLabel')}: ${getResidencyText()}</div>
                        </div>
                    </div>
                    <div class="review-section">
                        <div class="review-section-header">
                            <div class="review-section-title">${t('employmentIncome')}</div>
                            <button class="review-edit-btn" data-card="income">${t('edit')}</button>
                        </div>
                        <div class="review-content">${employersHtml}</div>
                    </div>
                    <div class="review-section">
                        <div class="review-section-header">
                            <div class="review-section-title">${t('otherIncomeTitle')}</div>
                            <button class="review-edit-btn" data-card="income">${t('edit')}</button>
                        </div>
                        <div class="review-content">${otherIncomeHtml}</div>
                    </div>
                    <div class="review-section">
                        <div class="review-section-header">
                            <div class="review-section-title">${t('workDeductions')}</div>
                            <button class="review-edit-btn" data-card="deductions">${t('edit')}</button>
                        </div>
                        <div class="review-content">${deductionsHtml}</div>
                    </div>
                    <div class="review-section">
                        <div class="review-section-header">
                            <div class="review-section-title">${t('incomeTestsTitle')}</div>
                            <button class="review-edit-btn" data-card="adjustments">${t('edit')}</button>
                        </div>
                        <div class="review-content">${adjustmentsHtml}</div>
                    </div>
                    <div class="review-section">
                        <div class="review-section-header">
                            <div class="review-section-title">${t('privateHealthTitle')}</div>
                            <button class="review-edit-btn" data-card="health">${t('edit')}</button>
                        </div>
                        <div class="review-content">${healthHtml}</div>
                    </div>

                    <div class="tax-summary">
                        <div class="tax-summary-title">${t('taxSummary')}</div>

                        ${calculation.rentalLossCarryForward && calculation.rentalLossCarryForward > 0 ? `
                            <div class="rental-loss-info">
                                <div class="rental-loss-title">🏠 Rental Property Loss Summary</div>
                                <div class="rental-loss-row">
                                    <span>Total rental loss this year:</span>
                                    <span>${formatMoney(Math.abs(calculation.rentalNet || 0))}</span>
                                </div>
                                <div class="rental-loss-row">
                                    <span>Loss used to reduce your other income:</span>
                                    <span>${formatMoney(calculation.rentalLossUsed || 0)}</span>
                                </div>
                                <div class="rental-loss-divider"></div>
                                <div class="rental-loss-row total">
                                    <span>Loss carried forward to next year:</span>
                                    <span class="highlight">${formatMoney(calculation.rentalLossCarryForward)}</span>
                                </div>
                                <div class="rental-loss-note">
                                    ℹ️ This amount can be claimed on your next year's tax return. Keep a copy of this report for your records.
                                </div>
                            </div>
                        ` : ''}

                        <!-- BLUR WRAPPER — covers everything except estimated refund -->
                        <div class="ts-blur-wrapper">
                            <div class="ts-blurred-rows">
                                <div class="tax-summary-row">
                                    <span>${t('totalIncomeLabel')}</span>
                                    <span>${formatMoney(calculation.totalIncome)}</span>
                                </div>
                                <div class="tax-summary-row">
                                    <span>${t('totalDeductionsLabel')}</span>
                                    <span>- ${formatMoney(calculation.totalDeductions)}</span>
                                </div>
                                <div class="tax-summary-divider"></div>
                                <div class="tax-summary-row total">
                                    <span>${t('taxableIncomeLabel')}</span>
                                    <span>${formatMoney(calculation.taxableIncome)}</span>
                                </div>
                                <div class="tax-summary-row">
                                    <span>${t('incomeTaxLabel')}</span>
                                    <span>${formatMoney(calculation.incomeTax)}</span>
                                </div>
                                <div class="tax-summary-row">
                                    <span>${t('medicareLevyLabel')}</span>
                                    <span>+ ${formatMoney(calculation.medicareLevy)}</span>
                                </div>
                                <div class="tax-summary-row">
                                    <span>${t('medicareSurchargeLabel')}</span>
                                    <span>+ ${formatMoney(calculation.medicareSurcharge)}</span>
                                </div>
                                <div class="tax-summary-row">
                                    <span>${t('litoLabel')}</span>
                                    <span>- ${formatMoney(calculation.lito)}</span>
                                </div>
                                <div class="tax-summary-divider"></div>
                                <div class="tax-summary-row total">
                                    <span>${t('totalTaxLiabilityLabel')}</span>
                                    <span>${formatMoney(calculation.totalTaxLiability)}</span>
                                </div>
                                <div class="tax-summary-row">
                                    <span>${t('totalTaxWithheldLabel')}</span>
                                    <span>${formatMoney(calculation.totalTaxWithheld)}</span>
                                </div>
                                <div class="tax-summary-row">
                                    <span>${t('frankingCreditsLabel')}</span>
                                    <span>+ ${formatMoney(calculation.frankingCreditOffset)}</span>
                                </div>
                            </div>

                            <!-- Glass overlay — hint only, no button -->
                            <div class="ts-overlay">
                                <div class="ts-overlay-card">
                                    <div class="ts-overlay-emoji">🎉</div>
                                    <div class="ts-overlay-headline">${t('reviewOverlayHeadline')}</div>
                                    <div class="ts-overlay-body">${t('reviewOverlayBody')}</div>
                                    <div class="ts-overlay-meta">${t('reviewOverlayMeta')}</div>
                                </div>
                            </div>
                        </div>
                        <!-- BLUR WRAPPER END -->

                        <div class="tax-summary-divider"></div>
                        <div class="tax-summary-row grand-total">
                            <span>${t('estimatedRefundLabel')}</span>
                            <span class="${calculation.refund >= 0 ? 'refund-positive' : 'refund-negative'}">
                                ${formatMoney(Math.abs(calculation.refund))} ${calculation.refund >= 0 ? t('refund') : t('owing')}
                            </span>
                        </div>
                    </div>
                        
                    </div>
                </div>
            `;

            case 'declaration':
                const refundCalc = calculateRefund(userData);
                return `
                    <div class="declaration-container">
                        <div class="warning-box warning">
                            <strong>${t('declarationLegalNotice')}</strong>
                            <p>${t('declarationLegalText')}</p>
                        </div>
                        
                        <label class="checkbox-group">
                            <input type="checkbox" id="declarationCheckbox">
                            <span>${t('declarationConfirmText')}</span>
                        </label>
                        
                        <div class="delivery-title">${t('deliveryTitle')}</div>

                        <div class="delivery-options">
                            <div class="delivery-card" data-method="download">
                                <div class="delivery-icon">💾</div>
                                <div class="delivery-option-title">${t('downloadOption')}</div>
                                <div class="delivery-desc">${t('downloadDesc')}</div>
                            </div>

                            <div class="delivery-card" data-method="email">
                                <div class="delivery-icon">📧</div>
                                <div class="delivery-option-title">${t('emailOption')}</div>
                                <div class="delivery-desc">${t('emailDesc')}</div>

                                <div class="delivery-email-field" style="display: none;">
                                    
                                    <div class="email-value" id="userEmailDisplay">
                                        ${escapeHtml(userData.email || 'Not provided')}
                                    </div>

                                    <div class="email-hint">
                                        ${t('declarationEmailHint')}
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                
                    <div class="bilingual-option">
                        <label class="checkbox-group" style="align-items: flex-start;">
                            <input type="checkbox" id="bilingualReportCheckbox" ${userData.bilingualReport ? 'checked' : ''}>
                            <span>
                                ${t('bilingualReportLabel')}
                                <small style="display: block; margin-top: 2px; font-weight: normal; color: var(--text-muted);">${t('bilingualReportHint')}</small>
                            </span>
                        </label>
                    </div>
                
            `;

        case 'payment':
            const employerCount = (userData.employers || []).length;
            const hasAbn = (userData.abnIncome || 0) > 0;
            const baseFee = hasAbn
                ? (window.pricing.abn_fee || 89.99)
                : employerCount > 1
                    ? (window.pricing.multiple_jobs_fee || 79.99)
                    : (window.pricing.standard_fee || 69.99);
            let payDiscountAmount = 0;
            let payAppliedPromo = '';
            if (userData.appliedPromo) {
                payAppliedPromo = userData.appliedPromo.code;
                payDiscountAmount = userData.appliedPromo.discount;
            }
            const finalTotal = baseFee - payDiscountAmount;
            return `
                <div class="payment-container">

                    <!-- Order Summary -->
                    <div class="order-summary">
                        <div class="order-summary-title">${t('orderSummary')}</div>
                        <div class="order-summary-row">
                            <span>${t('taxReturnFee')}</span>
                            <span>${formatCurrency(baseFee)}</span>
                        </div>

                        <div class="promo-toggle-row">
                            <button class="promo-toggle-link" id="promoToggleBtn">${t('havePromoCode')}</button>
                        </div>
                        <div class="order-summary-promo" id="promoSection" style="display: ${payAppliedPromo ? 'block' : 'none'}">
                            <div class="promo-input-group">
                                <input type="text" id="promoCodeInput" class="form-input"
                                    placeholder="${stripHtml(t('promoCode'))}"
                                    value="${escapeHtml(payAppliedPromo)}"
                                    autocomplete="off">
                                <button id="applyPromoBtn" class="nav-btn secondary">${stripHtml(t('apply'))}</button>
                            </div>
                            <div id="promoMessage" class="promo-message"></div>
                        </div>

                        <div class="order-summary-row discount-row" id="discountRow" style="display: ${payDiscountAmount > 0 ? 'flex' : 'none'}">
                            <span>${t('discount')}</span>
                            <span id="discountAmountSpan">- ${formatCurrency(payDiscountAmount)}</span>
                        </div>

                        <div class="order-summary-divider"></div>
                        <div class="order-summary-row total-row">
                            <span>${t('total')}</span>
                            <span id="totalAmount">${formatCurrency(finalTotal)}</span>
                        </div>
                    </div>

                    <!-- Trust badges -->
                    <div class="payment-trust-row">
                        <div class="trust-badge-payment">🔒 ${stripHtml(t('trustStripe'))}</div>
                        <div class="trust-badge-payment">✓ ${stripHtml(t('trustSsl'))}</div>
                        <div class="trust-badge-payment">💳 ${stripHtml(t('trustCards'))}</div>
                    </div>

                    <!-- Payment methods -->
                    <div class="payment-two-col">
                        <div class="payment-col">
                            <div class="payment-method-title">${t('digitalWallets')}</div>
                            <div id="applePayButton" class="wallet-button apple-pay-btn"></div>
                            <div id="googlePayButton" class="wallet-button google-pay-btn"></div>
                            <div class="wallet-note">${stripHtml(t('walletNote'))}</div>
                        </div>
                        <div class="payment-col">
                            <div class="payment-method-title">${t('cardPayment')}</div>
                            <div id="cardElement" class="stripe-card-element"></div>
                            <div id="cardErrors" class="card-errors" style="display: none;"></div>
                        </div>
                    </div>

                    <!-- Pay button -->
                    <button id="payBtn" class="pay-button">
                        ${stripHtml(t('payButtonLabel'))} — ${formatCurrency(finalTotal)}
                    </button>

                    <div id="paymentMessage" class="payment-message"></div>

                    <!-- Success modal -->
                    <div id="paymentSuccessModal" class="payment-modal" style="display: none;">
                        <div class="payment-modal-content">
                            <div class="success-animation">
                                <div class="success-checkmark">
                                    <div class="check-icon">✓</div>
                                </div>
                            </div>

                            <div class="payment-modal-title" id="successTitle">${t('paymentSuccess')}</div>

                            <div class="payment-modal-message" id="successMessage"></div>

                            <div class="spam-hint-subtle" id="fallbackHint" style="display:none;"></div>

                            <div class="action-buttons" id="fallbackOptions">
                                <button id="fallbackLeftBtn" class="action-btn secondary"></button>
                                <button id="fallbackRightBtn" class="action-btn primary"></button>
                            </div>

                            <button id="closeSuccessModal" class="close-btn">${t('startNewReturn')} →</button>
                        </div>
                    </div>
                </div>
            `;

        default:
            return '<div>Loading...</div>';
    }
}