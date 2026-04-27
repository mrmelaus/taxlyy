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
    
    // Tax residency flags (new)
    isAustralianTaxResident: undefined,   // true/false
    isTemporaryVisaHolder: undefined,     // true/false, only if isAustralianTaxResident == true
    hasMedicareExemptionCertificate: undefined, // true/false, only if isTemporaryVisaHolder == true
    isWHMVisaHolder: undefined,           // true/false, only if isAustralianTaxResident == false
    
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
    
    // ATI adjustments
    fringeBenefits: 0,
    reportableSuper: 0,
    taxFreeGovPayments: 0,
    financialInvestmentLoss: 0,
    childSupportPaid: 0,
    
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
function loadSavedData() {
    try {
        const saved = localStorage.getItem('taxlyy_userData');
        if (saved) {
            const parsed = JSON.parse(saved);

            // Migration shim: convert old taxResidencyStatus string to new boolean flags.
            // Safe to leave permanently — no-ops when new flags already present.
            if (parsed.taxResidencyStatus && parsed.isAustralianTaxResident === undefined) {
                const map = {
                    australian: { isAustralianTaxResident: true,  isTemporaryVisaHolder: false, isWHMVisaHolder: false },
                    temporary:  { isAustralianTaxResident: true,  isTemporaryVisaHolder: true,  isWHMVisaHolder: false },
                    whm:        { isAustralianTaxResident: false, isTemporaryVisaHolder: false, isWHMVisaHolder: true  },
                    foreign:    { isAustralianTaxResident: false, isTemporaryVisaHolder: false, isWHMVisaHolder: false }
                };
                const flags = map[parsed.taxResidencyStatus];
                if (flags) Object.assign(parsed, flags);
                delete parsed.taxResidencyStatus;
                // hasMedicareExemptionCertificate: no equivalent in old data,
                // left as undefined so the user is prompted to answer it.
            }

            userData = { ...userData, ...parsed };
        }
    } catch(e) {
        console.warn('loadSavedData failed:', e);
    }
}

function saveCurrentData() {
    try {
        localStorage.setItem('taxlyy_userData', JSON.stringify(userData));
    } catch(e) {
        console.warn('saveCurrentData failed:', e);
    }
}

// ========================================
// Update totals and estimate bar
// ========================================
function updateTotals() {
    // Employment income
    if (userData.employers && userData.employers.length > 0) {
        userData.totalIncome = userData.employers.reduce((sum, emp) => sum + (emp.grossIncome || 0), 0);
        userData.totalTaxWithheld = userData.employers.reduce((sum, emp) => sum + (emp.taxWithheld || 0), 0);
    } else {
        userData.totalIncome = 0;
        userData.totalTaxWithheld = 0;
    }

    // Other income
    if (userData.otherIncome) {
        const otherTotal = (userData.otherIncome.interest || 0) +
                           (userData.otherIncome.dividends || 0) +
                           (userData.otherIncome.otherAmount || 0);
        userData.totalIncome += otherTotal;
    }

    // Rental property (profit only)
    if (userData.rentalIncome !== undefined && userData.rentalExpenses !== undefined) {
        const rentalNet = (userData.rentalIncome || 0) - (userData.rentalExpenses || 0);
        if (rentalNet > 0) {
            userData.totalIncome += rentalNet;
        } else if (rentalNet < 0) {
            userData.rentalPropertyLoss = Math.abs(rentalNet);
        }
    }

    // Deductions
    userData.totalDeductions = (userData.homeOffice || 0) +
                               (userData.travelExpenses || 0) +
                               (userData.equipment || 0) +
                               (userData.selfEducation || 0) +
                               (userData.otherDeductions || 0);

    // Update estimate display
    const calculation = calculateRefund(userData);
    const estimateEl = document.getElementById('estimateAmount');
    const breakdownEl = document.getElementById('estimateBreakdown');

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

    if (breakdownEl) {
        breakdownEl.innerHTML = `
            <span>${formatCurrency(userData.totalIncome || 0)}</span>
            <span>↓</span>
            <span>${formatCurrency(userData.totalDeductions || 0)}</span>
            <span>→</span>
            <span>${formatCurrency(calculation.totalTaxLiability)}</span>
        `;
    }

    if (typeof updateEstimateAndDisplay === 'function') {
        updateEstimateAndDisplay(userData);
    }

    saveCurrentData();
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

    // Estimate bar mode
    const estimateBar = document.getElementById('estimateBar');
    if (estimateBar) {
        estimateBar.classList.remove('welcome-mode', 'scroll-away');

        if (card.id === 'welcome') {
            estimateBar.classList.add('welcome-mode');
            if (typeof refreshRunningNumberDisplay === 'function') {
                refreshRunningNumberDisplay();
            }
        } else if (card.id === 'personal') {
            estimateBar.classList.add('scroll-away');
            const estimateLabel = document.getElementById('estimateLabel');
            // FIX: use innerHTML not textContent — t() may return bilingual HTML spans
            if (estimateLabel) estimateLabel.innerHTML = t('estimatedReturn');
            if (typeof updateEstimateAndDisplay === 'function') {
                updateEstimateAndDisplay(userData);
            }
        } else {
            const estimateLabel = document.getElementById('estimateLabel');
            // FIX: use innerHTML not textContent
            if (estimateLabel) estimateLabel.innerHTML = t('estimatedReturn');
            if (typeof updateEstimateBarOnScroll === 'function') {
                updateEstimateBarOnScroll();
            }
            if (typeof updateEstimateAndDisplay === 'function') {
                updateEstimateAndDisplay(userData);
            }
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
    }

    if (cards[currentCardIndex].id === 'welcome') {
        const consentCb = document.getElementById('consentCheckbox');
        if (!consentCb || !consentCb.checked) return;
        if (typeof setWelcomeCardActive === 'function') setWelcomeCardActive(false);
    }

    // Personal card validation
    if (cards[currentCardIndex].id === 'personal') {
        const name = (userData.fullName || '').trim();
        const tfn = (userData.tfn || '').replace(/\D/g, '');
        const dob = (userData.dob || '');
        const dobParts = dob.split('/');
        const dobDigits = dob.replace(/\D/g, '');
        const dobValid = dobDigits.length === 8
            && parseInt(dobParts[0]) >= 1 && parseInt(dobParts[0]) <= 31
            && parseInt(dobParts[1]) >= 1 && parseInt(dobParts[1]) <= 12
            && parseInt(dobParts[2]) >= 1900 && parseInt(dobParts[2]) <= new Date().getFullYear();

        let hasError = false;

        // Name validation
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

        // TFN validation
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

        // DOB validation
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

        if (hasError) {
            document.querySelector('.form-error[style*="block"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // NEW: Tax residency questions validation
        if (userData.isAustralianTaxResident === undefined) {
            alert('Please select whether you are an Australian tax resident.');
            return;
        }

        if (userData.isAustralianTaxResident === true) {
            // Must answer temporary visa question
            if (userData.isTemporaryVisaHolder === undefined) {
                alert('Please indicate whether you hold a temporary visa.');
                return;
            }
            // If temporary visa holder, must answer Medicare certificate question
            if (userData.isTemporaryVisaHolder === true && userData.hasMedicareExemptionCertificate === undefined) {
                alert('Please indicate whether you have a current Medicare levy exemption certificate.');
                return;
            }
        } else {
            // Not a tax resident – must answer WHM visa question
            if (userData.isWHMVisaHolder === undefined) {
                alert('Please indicate whether you hold a Working Holiday Maker visa.');
                return;
            }
        }
    }

    // Income card validation
    if (cards[currentCardIndex].id === 'income') {
        if (!userData.employers || userData.employers.length === 0) {
            alert('Please add at least one employer before continuing.');
            return;
        }
        const invalidEmployer = userData.employers.find(emp => (emp.grossIncome || 0) <= 0);
        if (invalidEmployer) {
            alert(`Employer "${invalidEmployer.employerName || 'Unknown'}" has invalid or zero gross income. Please enter a valid gross income amount.`);
            return;
        }
    }

    if (cards[currentCardIndex].id === 'review') {
        sessionStorage.removeItem('returnToReview');
    }

    // Health card validation
    if (cards[currentCardIndex].id === 'health') {
        const missing = [];
        if (userData.hasPrivateHospitalCover === undefined) missing.push(stripHtml(t('hospitalCover')));
        if (userData.isSingle === undefined) missing.push(stripHtml(t('familySituation')));
        if (userData.phiRebateMethod === undefined) missing.push(stripHtml(t('phiRebate')));
        if (userData.lhcLoading === undefined) missing.push(stripHtml(t('lhcLoading')));

        if (missing.length > 0) {
            alert(`Please complete all health sections before continuing:\n- ${missing.join('\n- ')}`);
            return;
        }
    }

    // Declaration card validation
    if (cards[currentCardIndex].id === 'declaration') {
        const cb = document.getElementById('declarationCheckbox');
        if (!cb || !cb.checked) {
            alert('Please accept the declaration to continue.');
            return;
        }
        if (!userData.deliveryMethod) {
            alert(t('deliveryRequired'));
            return;
        }
        if (userData.deliveryMethod === 'email') {
            const email = document.getElementById('userEmail')?.value;
            if (!email || !email.includes('@')) {
                alert('Please enter a valid email address.');
                return;
            }
            userData.userEmail = email;
        }
        const bilingualCheckbox = document.getElementById('bilingualReportCheckbox');
        if (bilingualCheckbox) {
            userData.bilingualReport = bilingualCheckbox.checked;
        }
        saveCurrentData();
    }

    // Navigation
    if (cards[currentCardIndex].id === 'payment') return;

    if (currentCardIndex < cards.length - 1) {
        currentCardIndex++;
        renderCard();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function prevCard() {
    if (currentCardIndex >= 2) {
        currentCardIndex--;
        renderCard();
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
        const validation = validatePayslipData(extracted);
        if (!validation.isValid) {
            alert(`OCR could not read all data:\n${validation.errors.join('\n')}\n\nPlease enter employer details manually.`);
            resetUploadZone();
            return;
        }

        const payPeriodEnd = extracted.payPeriod?.end;
        const isFinal = payPeriodEnd ? isFinalPayslip(payPeriodEnd) : false;

        if (!isFinal && payPeriodEnd) {
            const userConfirmed = confirm(
                `The payslip period ends on ${payPeriodEnd}.\n\n` +
                `For accurate YTD totals, you should upload the final payslip covering 30 June.\n\n` +
                `Do you want to continue with this payslip? (You can edit amounts later)`
            );
            if (!userConfirmed) { resetUploadZone(); return; }
        } else if (!payPeriodEnd) {
            const userConfirmed = confirm(
                `The payslip's pay period could not be read automatically.\n\n` +
                `Please confirm that this is your final payslip covering up to 30 June.\n\n` +
                `Do you want to continue?`
            );
            if (!userConfirmed) { resetUploadZone(); return; }
        }

        const userFullName = (userData.fullName || '').trim().toUpperCase();
        const extractedEmployeeName = (extracted.employeeName || '').trim().toUpperCase();
        if (userFullName && extractedEmployeeName && userFullName !== extractedEmployeeName) {
            const userConfirmed = confirm(
                `⚠️ Name mismatch\n\n` +
                `Payslip shows employee name: ${(extracted.employeeName || '').toUpperCase()}\n` +
                `Your entered name: ${userData.fullName || ''}\n\n` +
                `Please verify this payslip belongs to you.\n` +
                `If the name on the personal card is incorrect, click the "Back" button at the bottom of this page to return to the Personal Information card and correct it.\n\n` +
                `Do you want to continue with this payslip anyway? (You can edit amounts later)`
            );
            if (!userConfirmed) { resetUploadZone(); return; }
        }

        if (!userData.employers) userData.employers = [];
        userData.employers.push({
            employerName: extracted.employerName || 'Unknown Employer',
            employerAbn: extracted.employerAbn || '',
            grossIncome: extracted.grossIncomeYTD || 0,
            taxWithheld: extracted.taxWithheldYTD || 0,
            payPeriod: extracted.payPeriod
        });

        updateTotals();
        renderCard();

        uploadZone.innerHTML = `
            <div style="color: var(--accent);">✓ Payslip processed successfully!</div>
            <small>${extracted.employerName || 'Employer'} added.</small>
        `;
        setTimeout(resetUploadZone, 2000);

    } catch (error) {
        console.error('Upload error:', error);
        alert(`Error processing payslip: ${error.message}\n\nPlease try manual entry.`);
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
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (year < 100) year += 2000;
    if (month > 6) return true;
    if (month === 6 && day >= 30) return true;
    return false;
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
    window.currentLang = lang; // FIX: always set on window, not a local variable

    document.getElementById('lang-en')?.classList.toggle('active', lang === 'en');
    document.getElementById('lang-zh')?.classList.toggle('active', lang === 'zh');

    const label = document.getElementById('estimateLabel');
    // FIX: use t() + innerHTML so bilingual mode works correctly
    if (label) label.innerHTML = t('estimatedReturn');

    const disclaimerText = document.querySelector('.disclaimer-text');
    // FIX: use innerHTML for disclaimer too (may contain bilingual spans)
    if (disclaimerText) disclaimerText.innerHTML = t('disclaimerText');

    const isLastCard = currentCardIndex === cards.length - 1;
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.textContent = lang === 'zh' ? '← 返回' : '← Back';
    if (nextBtn) {
        nextBtn.textContent = lang === 'zh'
            ? (isLastCard ? '支付并获取报告' : '继续 →')
            : (isLastCard ? 'Pay & Get Report' : 'Next →');
    }

    renderCard();

    if (cards[currentCardIndex]?.id === 'welcome' && typeof refreshRunningNumberDisplay === 'function') {
        refreshRunningNumberDisplay();
    }

    if (typeof updateEstimateAndDisplay === 'function') {
        updateEstimateAndDisplay(userData);
    }
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
window.saveCurrentData = saveCurrentData;
window.loadSavedData = loadSavedData;
window.setLanguage = setLanguage;
window.processPayment = processPayment;
window.updateHeaderOnScroll = updateHeaderOnScroll;
window.updateEstimateBarOnScroll = updateEstimateBarOnScroll;
window.setupUploadListeners = setupUploadListeners;
window.handleUpload = handleUpload;
window.resetUploadZone = resetUploadZone;
window.isFinalPayslip = isFinalPayslip;
window.addEmployerManually = addEmployerManually;