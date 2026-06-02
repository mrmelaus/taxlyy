// navigation.js
// ========================================
// Core navigation, state, data persistence, and UI interactions
// ========================================

// Global state
const cards = [
    { id: 'welcome', titleKey: 'welcome' },
    { id: 'personal', titleKey: 'personalInfo' },
    { id: 'income', titleKey: 'employmentIncome' },
    { id: 'adjustments', titleKey: 'incomeTestsTitle' },
    { id: 'deductions', titleKey: 'workDeductions' },
    { id: 'health', titleKey: 'privateHealth' },
    { id: 'review', titleKey: 'reviewReturn' },
    { id: 'declaration', titleKey: 'declaration' },
    { id: 'payment', titleKey: 'payment' }
];

let currentCardIndex = 0;
// REMOVED: let currentLang = 'en' — use window.currentLang (set in utils.js) everywhere

let userData = {
    // Personal
    fullName: '',
    tfn: '',
    dob: '',
    email: '',


    taxableIncome: 0,
    
    // Tax residency flags (new)
    visaType: undefined,
    isTaxResident: undefined,
    hasMedicareExemptCert: undefined,
    isNdaCountry: undefined,
    taxStatus: undefined,
    
    // Employment & income
    employers: [],        // each: { grossIncome, taxWithheld }
    otherIncome: {
        interest: 0,
        dividends: 0,
        otherAmount: 0
    },
    frankingCredits: 0,
    governmentPayments: 0,
    targetForeignIncome: 0,
    
    // Deductions
    homeOffice: 0,
    travelExpenses: 0,
    equipment: 0,
    selfEducation: 0,
    otherDeductions: 0,
    
    // Rental
    rentalIncome: 0,
    rentalExpenses: 0,

    // Capital gains
    capitalGains: 0,
    capitalLosses: 0,
    priorYearCapitalLosses: 0,
    cgtDiscountApplies: false,

    // After frankingCredits: 0,
    govTaxWithheld: 0,        // NEW — tax withheld on govt payments

    // After capitalGains section:
    abnIncome: 0,             // NEW — gross ABN income
    abnExpenses: 0,           // NEW — ABN business expenses
    abnTaxWithheld: 0,        // NEW — tax withheld on ABN income
    
    // ATI adjustments
    fringeBenefits: 0,
    reportableSuper: 0,
    taxFreeGovPayments: 0,
    financialInvestmentLoss: 0,
    childSupportPaid: 0, 
    hasHecsLoan: undefined,
    hecsManualRepaymentIncome: 0,
    
    // Medicare Levy Surcharge
    hasPrivateHospitalCover: undefined,
    isSingle: undefined,
    daysWithoutCover: undefined,   // 0-365
    dependentChildren: 0,
        
    // Payment & promo
    appliedPromo: null,
    discountAmount: 0,
    originalTotal: 0,
    finalTotal: 0,
    promoCode: null
};

// ========== WARNING ON REFRESH ==========
// Add this RIGHT HERE, after userData is defined
function hasAnyUserData() {
    return userData.tfn || 
           userData.fullName || 
           (userData.employers && userData.employers.length > 0);
}

window.addEventListener('beforeunload', (e) => {
    if (hasAnyUserData()) {
        e.preventDefault();
        e.returnValue = 'Your data will be lost if you refresh. Please complete your return in one session.';
    }
});

function resetUserData() {
    // Fresh copy of the initial userData
    userData = {
        fullName: '',
        tfn: '',
        dob: '',
        email: '',
        taxableIncome: 0,
        visaType: undefined,
        isTaxResident: undefined,
        hasMedicareExemptCert: undefined,
        isNdaCountry: undefined,
        taxStatus: undefined,
        employers: [],
        otherIncome: { interest: 0, dividends: 0, otherAmount: 0 },
        frankingCredits: 0,
        governmentPayments: 0,
        targetForeignIncome: 0,
        homeOffice: 0,
        travelExpenses: 0,
        equipment: 0,
        selfEducation: 0,
        otherDeductions: 0,
        rentalIncome: 0,
        rentalExpenses: 0,
        capitalGains: 0,
        capitalLosses: 0,
        priorYearCapitalLosses: 0,
        cgtDiscountApplies: false,
        govTaxWithheld: 0,
        abnIncome: 0,
        abnExpenses: 0,
        abnTaxWithheld: 0,
        fringeBenefits: 0,
        reportableSuper: 0,
        taxFreeGovPayments: 0,
        financialInvestmentLoss: 0,
        childSupportPaid: 0,
        hasHecsLoan: false,
        hecsManualRepaymentIncome: 0,
        hasPrivateHospitalCover: undefined,
        isSingle: undefined,
        daysWithoutCover: undefined,
        dependentChildren: 0,
        appliedPromo: null,
        discountAmount: 0,
        originalTotal: 0,
        finalTotal: 0,
        promoCode: null
    };
    // Clear localStorage
    localStorage.removeItem('taxlyy_userData');
}


function deriveTaxStatus(data) {
    const v = data.visaType;

    if (v === 'citizen_pr') {
        return 'australian';
    }

    if (v === 'temp_visa') {
        if (data.isTaxResident === false) return 'foreign';
        // isTaxResident === true
        if (data.hasMedicareExemptCert === true) return 'resident_exempt';
        return 'australian'; // resident, pays Medicare levy
    }

    if (v === 'whm') {
        if (data.isTaxResident === false) return 'whm';
        // isTaxResident === true (rare)
        if (data.isNdaCountry === true) return 'whm_nda_resident';
        return 'whm'; // resident but non-NDA — WHM rates still apply
    }

    return undefined; // not yet answered
}

// ========================================
// Header scroll animation & language button short forms
// ========================================
let ticking = false;

function updateHeaderOnScroll() {
    const header = document.querySelector('.app-header');
    const langEn = document.getElementById('lang-en');
    const langZh = document.getElementById('lang-zh');

    if (!header) return;

    if (header.classList.contains('expanded')) {
        ticking = false;
        return;
    }

    if (window.scrollY > 10) {
        header.classList.add('scrolled');
        if (langEn) langEn.textContent = 'EN';
        if (langZh) langZh.textContent = '中';
    } else {
        header.classList.remove('scrolled');
        if (langEn) langEn.innerHTML = t('langEn') || 'English';
        if (langZh) langZh.innerHTML = t('langZh') || '中英文 (双语)';
    }
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateHeaderOnScroll);
        ticking = true;
    }
});

// ========================================
// Estimate bar shrink on scroll (non-welcome cards only)
// ========================================
let estimateTicking = false;

function updateEstimateBarOnScroll() {
    const estimateBar = document.getElementById('estimateBar');
    if (!estimateBar) return;
    if (estimateBar.classList.contains('welcome-mode')) return;

    if (window.scrollY > 50) {
        estimateBar.classList.add('scrolled');
    } else {
        estimateBar.classList.remove('scrolled');
    }
    estimateTicking = false;
}

window.addEventListener('scroll', () => {
    if (!estimateTicking) {
        requestAnimationFrame(updateEstimateBarOnScroll);
        estimateTicking = true;
    }
});

// ========================================
// Data persistence
// ========================================


// ========================================
// Update totals and estimate bar
// ========================================
function updateTotals() {
    // Use calculateRefund as the single source of truth
    const calculation = calculateRefund(userData);
    
    // Update userData with calculated values
    userData.totalIncome = calculation.totalIncome;
    userData.totalDeductions = calculation.totalDeductions;
    userData.taxableIncome = calculation.taxableIncome;
    userData.totalTaxWithheld = calculation.totalTaxWithheld;
    userData.totalTaxLiability = calculation.totalTaxLiability;
    
    // Update estimate bar display
    const estimateEl = document.getElementById('estimateAmount');
    if (estimateEl) {
        const refundAmount = calculation.refund;
        if (refundAmount >= 0) {
            estimateEl.innerHTML = formatCurrency(refundAmount);
            estimateEl.style.color = 'var(--accent)';
        } else {
            estimateEl.innerHTML = `-${formatCurrency(Math.abs(refundAmount))}`;
            estimateEl.style.color = 'var(--error)';
        }
    }
    
    const breakdownEl = document.getElementById('estimateBreakdown');
    if (breakdownEl) {
        breakdownEl.innerHTML = `
            <span>${formatCurrency(calculation.totalIncome)}</span>
            <span>↓</span>
            <span>${formatCurrency(calculation.totalDeductions)}</span>
            <span>→</span>
            <span>${formatCurrency(calculation.totalTaxLiability)}</span>
        `;
    }
    
    // Update estimate hint
    if (typeof updateEstimateAndDisplay === 'function') {
        updateEstimateAndDisplay(userData);
    }
}

// ========================================
// Render current card
// ========================================
function renderCard() {
    const container = document.getElementById('cardContainer');
    if (!container) return;

    const card = cards[currentCardIndex];

    // FIX: use t() not tBilingual() — t() returns a proper string (with bilingual spans if zh)
    // tBilingual() returns an object {zh, en} which renders as [object Object]
    const titleText = t(card.titleKey);

    container.innerHTML = `
        <div class="card" id="card-${card.id}">
            <div class="card-header">
                <div class="card-title">${titleText}</div>
                <div class="card-progress">${currentCardIndex + 1} of ${cards.length}</div>
            </div>
            <div class="card-body">
                ${getCardHtml(card.id)}
            </div>
        </div>
    `;

    updateProgress();
    updateTotals();
    attachCardEventListeners(card.id);

    // Back button visibility
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.style.display = (currentCardIndex === 0 || currentCardIndex === 1) ? 'none' : 'flex';
    }

    // Estimate bar
    const estimateBar = document.getElementById('estimateBar');
    if (estimateBar) {
        estimateBar.classList.remove('scroll-away');

        if (card.id === 'welcome') {
            estimateBar.style.display = 'none';
        } else {
            estimateBar.style.display = '';

            if (card.id === 'personal') {
                estimateBar.classList.add('scroll-away');
            }

            const estimateLabel = document.getElementById('estimateLabel');
            if (estimateLabel) estimateLabel.innerHTML = t('estimatedReturn');

            if (typeof updateEstimateBarOnScroll === 'function') updateEstimateBarOnScroll();
            if (typeof updateEstimateAndDisplay === 'function') updateEstimateAndDisplay(userData);
        }
    }

    // Header expanded mode
    const header = document.querySelector('.app-header');
    if (header) {
        if (card.id === 'welcome') {
            header.classList.remove('expanded');
        } else {
            header.classList.add('expanded');
        }
    }
}
// ========================================
// Navigation
// ========================================
function nextCard() {
    if (sessionStorage.getItem('returnToReview') === 'true') {
        sessionStorage.removeItem('returnToReview');
      
        const reviewIndex = cards.findIndex(c => c.id === 'review');
        if (reviewIndex !== -1) {
            currentCardIndex = reviewIndex;
            renderCard();
            updateNextButtonLabel();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
    }

    if (cards[currentCardIndex].id === 'welcome') {
        const consentCb = document.getElementById('consentCheckbox');
        if (!consentCb || !consentCb.checked) return;
        }

    // ========================================
    // PERSONAL CARD VALIDATION
    // ========================================
    if (cards[currentCardIndex].id === 'personal') {
        const cardErrorEl = document.getElementById('personalCardError');
        if (cardErrorEl) cardErrorEl.style.display = 'none';

        let hasError = false;

        // Name
        const name = (userData.fullName || '').trim();
        const nameEl = document.getElementById('fullName');
        const nameError = document.getElementById('fullNameError');
        if (name.length < 2) {
            if (nameEl) nameEl.style.borderColor = 'var(--error)';
            if (nameError) nameError.style.display = 'block';
            hasError = true;
        } else {
            if (nameEl) nameEl.style.borderColor = 'var(--accent)';
            if (nameError) nameError.style.display = 'none';
        }

        // TFN
        const tfn = (userData.tfn || '').replace(/\D/g, '');
        const tfnEl = document.getElementById('tfn');
        const tfnError = document.getElementById('tfnError');
        if (tfn.length !== 9) {
            if (tfnEl) tfnEl.style.borderColor = 'var(--error)';
            if (tfnError) tfnError.style.display = 'block';
            hasError = true;
        } else {
            if (tfnEl) tfnEl.style.borderColor = 'var(--accent)';
            if (tfnError) tfnError.style.display = 'none';
        }

        // DOB
        const dob = (userData.dob || '');
        const dobParts = dob.split('/');
        const dobDigits = dob.replace(/\D/g, '');
        const dobValid = dobDigits.length === 8
            && parseInt(dobParts[0]) >= 1 && parseInt(dobParts[0]) <= 31
            && parseInt(dobParts[1]) >= 1 && parseInt(dobParts[1]) <= 12
            && parseInt(dobParts[2]) >= 1900 && parseInt(dobParts[2]) <= new Date().getFullYear();
        const dobEl = document.getElementById('dob');
        const dobError = document.getElementById('dobError');
        if (!dobValid) {
            if (dobEl) dobEl.style.borderColor = 'var(--error)';
            if (dobError) dobError.style.display = 'block';
            hasError = true;
        } else {
            if (dobEl) dobEl.style.borderColor = 'var(--accent)';
            if (dobError) dobError.style.display = 'none';
        }

        // Email
        const email = (userData.email || '').trim();
        const emailEl = document.getElementById('email');
        const emailError = document.getElementById('emailError');
        if (!email || !validateEmail(email)) {
            if (emailEl) emailEl.style.borderColor = 'var(--error)';
            if (emailError) emailError.style.display = 'block';
            hasError = true;
        } else {
            if (emailEl) emailEl.style.borderColor = 'var(--accent)';
            if (emailError) emailError.style.display = 'none';
        }

        // Q1 — visa type must be selected
        if (userData.visaType === undefined) {
            hasError = true;
            const visaGroup = document.getElementById('visaTypeGroup');
            if (visaGroup) {
                visaGroup.style.border = '1px solid var(--error)';
                visaGroup.style.borderRadius = 'var(--radius-md)';
                visaGroup.style.padding = 'var(--space-3)';
                visaGroup.style.backgroundColor = 'rgba(255, 77, 109, 0.05)';
            }
        }

        // Q2 — tax residency must be answered for temp_visa and whm
        if (userData.visaType === 'temp_visa' || userData.visaType === 'whm') {
            if (userData.isTaxResident === undefined) {
                hasError = true;
                const resGroup = document.querySelector('#taxResidentGroup .tax-residency-group');
                if (resGroup) {
                    resGroup.style.border = '1px solid var(--error)';
                    resGroup.style.borderRadius = 'var(--radius-md)';
                    resGroup.style.padding = 'var(--space-3)';
                    resGroup.style.backgroundColor = 'rgba(255, 77, 109, 0.05)';
                }
                const resGroupEl = document.getElementById('taxResidentGroup');
                
              }
        }

        // Q3a — Medicare cert must be answered for temp_visa + tax resident
        if (userData.visaType === 'temp_visa' && userData.isTaxResident === true) {
            if (userData.hasMedicareExemptCert === undefined) {
                hasError = true;
                const medGroup = document.querySelector('#medicareCertGroup .tax-residency-group');
                if (medGroup) {
                    medGroup.style.border = '1px solid var(--error)';
                    medGroup.style.borderRadius = 'var(--radius-md)';
                    medGroup.style.padding = 'var(--space-3)';
                    medGroup.style.backgroundColor = 'rgba(255, 77, 109, 0.05)';
                }
                const medGroupEl = document.getElementById('medicareCertGroup');
                
              }
        }

        // Q3b — NDA country must be answered for whm + tax resident
        if (userData.visaType === 'whm' && userData.isTaxResident === true) {
            if (userData.isNdaCountry === undefined) {
                hasError = true;
                const ndaGroup = document.querySelector('#ndaCountryGroup .tax-residency-group');
                if (ndaGroup) {
                    ndaGroup.style.border = '1px solid var(--error)';
                    ndaGroup.style.borderRadius = 'var(--radius-md)';
                    ndaGroup.style.padding = 'var(--space-3)';
                    ndaGroup.style.backgroundColor = 'rgba(255, 77, 109, 0.05)';
                }
                const ndaGroupEl = document.getElementById('ndaCountryGroup');
                
              }
        }

        if (hasError) {
            if (cardErrorEl) {
                cardErrorEl.textContent = '⚠️ Please complete all required fields before continuing.';
                cardErrorEl.style.display = 'flex';
                cardErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // All questions answered — derive and store taxStatus
        userData.taxStatus = deriveTaxStatus(userData);

        if (typeof logEvent === 'function') {
            logEvent('residency_determined', {
                visaType: userData.visaType,
                isTaxResident: userData.isTaxResident,
                taxStatus: userData.taxStatus
            });
        }
    }

    // ========================================
    // INCOME CARD VALIDATION
    // ========================================
    if (cards[currentCardIndex].id === 'income') {
        if (!userData.employers || userData.employers.length === 0) {
            toastError('Please add at least one employer before continuing.');
            return;
        }
        const invalidEmployer = userData.employers.find(emp => (emp.grossIncome || 0) <= 0);
        if (invalidEmployer) {
            toastError(`Employer "${invalidEmployer.employerName || 'Unknown'}" has invalid or zero gross income. Please enter a valid gross income amount.`);
            return;
        }
    }

    // ========================================
    // ADJUSTMENTS CARD VALIDATION (HELP/HECS)
    // ========================================
    if (cards[currentCardIndex].id === 'adjustments') {
        if (userData.hasHecsLoan === undefined) {
            toastWarning('Please indicate whether you have a HELP/HECS student loan.');
            return;
        }
    }

    // ========================================
    // HEALTH CARD VALIDATION
    // ========================================
    if (cards[currentCardIndex].id === 'health') {
        const missing = [];
        if (userData.hasPrivateHospitalCover === undefined) missing.push(stripHtml(t('hospitalCover')));
        if (userData.isSingle === undefined) missing.push(stripHtml(t('familySituation')));
        if (userData.phiRebateMethod === undefined) missing.push(stripHtml(t('phiRebate')));
        if (userData.lhcLoading === undefined) missing.push(stripHtml(t('lhcLoading')));

        if (missing.length > 0) {
            toastError(`Please complete all health sections before continuing:\n${missing.join('\n')}`);
            return;
        }
    }

    // ========================================
    // DECLARATION CARD VALIDATION
    // ========================================
    if (cards[currentCardIndex].id === 'declaration') {
        const cb = document.getElementById('declarationCheckbox');
        if (!cb || !cb.checked) {
            toastError('Please accept the declaration to continue.');
            return;
        }
        if (!userData.deliveryMethod) {
            toastError(t('deliveryRequired'));
            return;
        }
        // Email validation removed — already on personal card
        const bilingualCheckbox = document.getElementById('bilingualReportCheckbox');
        if (bilingualCheckbox) {
            userData.bilingualReport = bilingualCheckbox.checked;
        }
    }

    if (cards[currentCardIndex].id === 'review') {
        sessionStorage.removeItem('returnToReview');
    }

    // Navigation
    if (cards[currentCardIndex].id === 'payment') return;

    if (currentCardIndex < cards.length - 1) {
        currentCardIndex++;
        renderCard();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateNextButtonLabel() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    if (!nextBtn) return;
    const lang = window.currentLang || 'en';
    const isLastCard = currentCardIndex === cards.length - 1;
    const returnToReview = sessionStorage.getItem('returnToReview') === 'true';
            
    if (prevBtn) {
    prevBtn.style.visibility = returnToReview ? 'hidden' : '';
    }

    if (sessionStorage.getItem('returnToReview') === 'true') {
        nextBtn.innerHTML = lang === 'zh'
            ? '返回审核 →'
            : 'Return to Review →';
    } else if (isLastCard) {
        nextBtn.innerHTML = lang === 'zh'
            ? '<span class="zh">支付并获取报告</span><span class="en">Pay & Get Report</span>'
            : 'Pay & Get Report';
    } else {
        nextBtn.innerHTML = lang === 'zh'
            ? '继续 →'
            : 'Next →';
    }
}

function prevCard() {
    if (sessionStorage.getItem('returnToReview') === 'true') return;

    if (currentCardIndex >= 2) {
        currentCardIndex--;
        renderCard();
        updateNextButtonLabel();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
function updateProgress() {
    const lang = window.currentLang || 'en';
    const progress = ((currentCardIndex + 1) / cards.length) * 100;
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    if (fill) fill.style.width = `${progress}%`;
    if (text) {
        text.textContent = lang === 'zh'
            ? `第 ${currentCardIndex + 1} / ${cards.length} 页`
            : `Card ${currentCardIndex + 1} of ${cards.length}`;
    }

    const isLastCard = currentCardIndex === cards.length - 1;
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) prevBtn.textContent = lang === 'zh' ? '← 返回' : '← Back';
    
    if (nextBtn) {
        if (isLastCard) {
            nextBtn.style.display = 'none';   // hide next button on last card
        } else {
            nextBtn.style.display = '';        // or 'inline-flex' / 'block' as needed
            nextBtn.textContent = lang === 'zh' ? '继续 →' : 'Next →';
        }
    }
}
// ========================================
// Upload handlers (OCR)
// ========================================
function setupUploadListeners() {
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('payslipInput');
    if (!zone || !input) return;

    zone.onclick = () => input.click();
    zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('drag-over'); };
    zone.ondragleave = () => zone.classList.remove('drag-over');
    zone.ondrop = async (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) await handleUpload(e.dataTransfer.files[0]);
    };
    input.onchange = async (e) => {
        if (e.target.files[0]) await handleUpload(e.target.files[0]);
    };
}

async function handleUpload(file) {
    
    const uploadZone = document.getElementById('uploadZone');
    if (!uploadZone) return;

    uploadZone.innerHTML = `
        <div class="upload-loading">
            <div class="spinner"></div>
            <div class="loading-text">${t('uploadProcessing')}</div>
            <small>${t('uploadProcessingHint')}</small>
        </div>
    `;

    try {
        const extracted = await processPayslip(file);

        window.lastOcrData = extracted;
        const validation = validatePayslipData(extracted);
        
        if (!validation.isValid) {
            toastError(`OCR could not read all data: ${validation.errors.join(', ')}. Please enter employer details manually.`);
            resetUploadZone();
            return;
        }

        const warnings = [];
        
        // 1. Check duplicate employer
        const existingEmployer = findEmployerByAbn(extracted.employerAbn);
        let isUpdateMode = false;
        let existingEmployerData = null;
        
        if (existingEmployer) {
            isUpdateMode = true;
            existingEmployerData = existingEmployer;
            warnings.push(`An employer with ABN ${extracted.employerAbn} (${existingEmployer.employerName}) already exists.`);
        }
        
        // 2. Check name mismatch
        const userFullName = (userData.fullName || '').trim().toUpperCase();
        const extractedEmployeeName = (extracted.employeeName || '').trim().toUpperCase();

        if (userFullName && !extractedEmployeeName) {
            warnings.push(`Name could not be read from this payslip. Please confirm it belongs to ${userData.fullName}.`);
        } else if (userFullName && extractedEmployeeName && userFullName !== extractedEmployeeName) {
            warnings.push(`Name mismatch: payslip shows "${extracted.employeeName}", but your name is "${userData.fullName}".`);
        }
        
        // 3. Check final payslip
        const payPeriodEnd = extracted.payPeriod?.end;
        const isFinal = payPeriodEnd ? isFinalPayslip(payPeriodEnd) : false;

        if (!isFinal && payPeriodEnd) {
            warnings.push(`The payslip period ends ${payPeriodEnd}, which is not in June. Please upload your final payslip for the financial year (pay period ending in June).`);
        } else if (!payPeriodEnd) {
            warnings.push(`Pay period could not be read. Please verify this is your final payslip with a period ending in June.`);
        }
        
        // Show confirm dialog if any warnings
        if (warnings.length > 0) {
            const userConfirmed = await new Promise((resolve) => {
                showConfirmDialog(warnings, () => resolve(true), () => resolve(false));
            });
            
            if (!userConfirmed) {
                resetUploadZone();
                return;
            }
        }
        
        // Proceed with adding or updating employer
        if (isUpdateMode) {
            existingEmployerData.grossIncome = extracted.grossIncomeYTD || 0;
            existingEmployerData.taxWithheld = extracted.taxWithheldYTD || 0;
            if (extracted.employerName) existingEmployerData.employerName = extracted.employerName;
            existingEmployerData._editing = true;
            if (typeof renderEmployerList === 'function') renderEmployerList();
            toastSuccess(`Updated: ${extracted.employerName}`);
        } else {
            if (!userData.employers) userData.employers = [];
            userData.employers.push({
                employerName: extracted.employerName || 'Unknown Employer',
                employerAbn: extracted.employerAbn || '',
                grossIncome: extracted.grossIncomeYTD || 0,
                taxWithheld: extracted.taxWithheldYTD || 0,
                payPeriod: extracted.payPeriod,
                _editing: true
            });
            if (typeof renderEmployerList === 'function') renderEmployerList();
            toastSuccess(`Added: ${extracted.employerName || 'Employer'}`);
        }

        updateTotals();
        renderCard();

        uploadZone.innerHTML = `
            <div style="color: var(--accent);">✓ Payslip processed successfully!</div>
            <small>${extracted.employerName || 'Employer'} ${isUpdateMode ? 'updated' : 'added'}.</small>
        `;
        setTimeout(resetUploadZone, 2000);

    } catch (error) {
        console.error('Upload error:', error);
        
        if (error.message === 'FILE_TOO_MANY_PAGES') {
            toastError('The payslip has too many pages. Please upload a single-page payslip or a PDF with 3 pages or less.');
        } else {
            toastError(`Error processing payslip: ${error.message}. Please try manual entry.`);
        }
        resetUploadZone();
    }
}

function resetUploadZone() {
    const uploadZone = document.getElementById('uploadZone');
    if (!uploadZone) return;
    uploadZone.innerHTML = `
        <div class="upload-drag-hint">${t('uploadHint')}</div>
        <input type="file" id="payslipInput" accept=".pdf,.jpg,.jpeg,.png" style="display:none">
    `;
    const fileInput = document.getElementById('payslipInput');
    if (fileInput) {
        fileInput.value = '';
        fileInput.onchange = (e) => {
            if (e.target.files && e.target.files[0]) handleUpload(e.target.files[0]);
        };
    }
    if (typeof setupUploadListeners === 'function') setupUploadListeners();
}

function isFinalPayslip(dateStr) {
    if (!dateStr) return false;
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length !== 3) return false;
    let day   = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year  = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (year < 100) year += 2000;

    return month === 6;  // ✅ any period ending in June is the final payslip
}

function addEmployerManually() {
    const name = prompt("Enter employer name:");
    if (!name) return;
    const income = parseFloat(prompt("Enter gross income YTD:"));
    if (isNaN(income)) return;
    const tax = parseFloat(prompt("Enter PAYG tax withheld:", "0"));
    if (!userData.employers) userData.employers = [];
    userData.employers.push({
        employerName: name,
        grossIncome: income,
        taxWithheld: isNaN(tax) ? 0 : tax,
        isManual: true
    });
    updateTotals();
    renderCard();
}

// ========================================
// Payment (mock – to be replaced with Stripe)
// ========================================
async function processPayment() {
    const btn = document.getElementById('nextBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Processing...';
    }

    setTimeout(async () => {
        if (userData.bilingualReport) {
            await generateTaxReport(userData, 'en');
            await generateTaxReport(userData, 'zh');
        } else {
            const userLang = window.currentLang === 'zh' ? 'zh' : 'en'; // FIX: window.currentLang
            await generateTaxReport(userData, userLang);
        }

        if (userData.deliveryMethod === 'email') {
            const email = userData.userEmail;
            if (email && email.includes('@')) {
                alert(`Payment successful! Your tax report has been sent to ${email}\n\nNote: Email sending will be implemented with backend integration.`);
            } else {
                alert('Payment successful! Your tax report has been downloaded.');
            }
        } else {
            alert('Payment successful! Your tax report is being downloaded.');
        }

        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Next →';
        }
    }, 1000);
}

// ========================================
// Language switching
// ========================================
function setLanguage(lang) {
    window.currentLang = lang;

    document.getElementById('lang-en')?.classList.toggle('active', lang === 'en');
    document.getElementById('lang-zh')?.classList.toggle('active', lang === 'zh');

    const logoZh = document.getElementById('logoZh');
    if (logoZh) logoZh.textContent = lang === 'zh' ? '税易(个人版)' : '';

    const label = document.getElementById('estimateLabel');
    if (label) label.innerHTML = t('estimatedReturn');

    const disclaimerText = document.querySelector('.disclaimer-text');
    if (disclaimerText) disclaimerText.innerHTML = t('disclaimerText');

    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) prevBtn.textContent = lang === 'zh' ? '← 返回' : '← Back';

    renderCard();

    // Re-initialize Stripe if on payment page
    if (cards[currentCardIndex]?.id === 'payment') {
        setTimeout(() => {
            const employerCount = (userData.employers || []).length;
            const hasAbn = (userData.abnIncome || 0) > 0;
            let currentTotal;

            if (hasAbn) {
                currentTotal = window.pricing?.abn_fee || 89.99;
            } else if (employerCount > 1) {
                currentTotal = window.pricing?.multiple_jobs_fee || 79.99;
            } else {
                currentTotal = window.pricing?.standard_fee || 69.99;
            }

            if (userData.discountAmount && userData.finalTotal) {
                currentTotal = userData.finalTotal;
            }

            if (typeof destroyStripePayment === 'function') destroyStripePayment();
            if (typeof initStripePayment === 'function' && currentTotal > 0) initStripePayment(currentTotal);
        }, 50);
    }

   
    if (typeof updateEstimateAndDisplay === 'function') {
        updateEstimateAndDisplay(userData);
    }

    // Always set correct button label last — respects returnToReview flag
    updateNextButtonLabel();
}
// ========================================
// Expose globals
// ========================================
window.cards = cards;
window.currentCardIndex = () => currentCardIndex;
window.userData = userData;
window.renderCard = renderCard;
window.nextCard = nextCard;
window.prevCard = prevCard;
window.updateTotals = updateTotals;
window.deriveTaxStatus = deriveTaxStatus;

window.setLanguage = setLanguage;
window.processPayment = processPayment;
window.updateHeaderOnScroll = updateHeaderOnScroll;
window.updateEstimateBarOnScroll = updateEstimateBarOnScroll;
window.setupUploadListeners = setupUploadListeners;
window.handleUpload = handleUpload;
window.resetUploadZone = resetUploadZone;
window.isFinalPayslip = isFinalPayslip;
window.addEmployerManually = addEmployerManually;
window.updateNextButtonLabel = updateNextButtonLabel; 
window.resetUserData = resetUserData;