// ========================================
// CALCULATOR - ATO Tax Calculations
// Taxlyy Individual
// Owned by Hepta Care Pty Ltd ABN 73 666 661 338
//
// DYNAMIC TAX RULES from Supabase
// ========================================

// ========================================
// 1. GLOBALS (will be overridden by Supabase)
// ========================================
let ACTIVE_TAX_YEAR = '2025-26';
let TAX_YEAR_OPTIONS = [
    { key: '2025-26', label: '2025-26 (1 Jul 2025 – 30 Jun 2026)' }
];

// Hardcoded fallback config (used only if Supabase fetch fails)
const FALLBACK_CONFIG = {
    '2025-26': {
        resident: [
            { min: 0,      max: 18200,    rate: 0,    base: 0 },
            { min: 18201,  max: 45000,    rate: 0.16, base: 0 },
            { min: 45001,  max: 135000,   rate: 0.30, base: 4288 },
            { min: 135001, max: 190000,   rate: 0.37, base: 31288 },
            { min: 190001, max: Infinity, rate: 0.45, base: 51638 }
        ],
        whm: [
            { min: 0,      max: 45000,    rate: 0.15, base: 0 },
            { min: 45001,  max: 135000,   rate: 0.30, base: 6750 },
            { min: 135001, max: 190000,   rate: 0.37, base: 33750 },
            { min: 190001, max: Infinity, rate: 0.45, base: 54100 }
        ],
        foreign: [
            { min: 0,      max: 135000,   rate: 0.30, base: 0 },
            { min: 135001, max: 190000,   rate: 0.37, base: 40500 },
            { min: 190001, max: Infinity, rate: 0.45, base: 60850 }
        ],
        lito: {
            max: 700,
            tier1Max: 37500,
            tier2Max: 45000,
            tier3Max: 66667,
            tier1Rate: 0.05,
            tier2Rate: 0.015
        },
        medicareLevy: {
            exemptThreshold: 27222,   // ATO 2025-26
            shadeInThreshold: 34028,  // FIX: was 34027, correct ATO figure is 34028
            shadeInRate: 0.10,
            fullRate: 0.02
        },
        mls: {
            single: [
                { min: 0,      max: 101000,   rate: 0 },
                { min: 101001, max: 118000,   rate: 0.01 },
                { min: 118001, max: 144000,   rate: 0.0125 },
                { min: 144001, max: Infinity, rate: 0.015 }
            ],
            family: [
                { min: 0,      max: 202000,   rate: 0 },
                { min: 202001, max: 236000,   rate: 0.01 },
                { min: 236001, max: 288000,   rate: 0.0125 },
                { min: 288001, max: Infinity, rate: 0.015 }
            ],
            childBoost: 1500
        }
    }
};

// Cache for loaded tax rules (per year)
let taxRulesCache = {};

// ========================================
// 2. SUPABASE LOADERS (called from app.js)
// ========================================

function setActiveTaxYear(year) {
    ACTIVE_TAX_YEAR = year;
}

function getActiveTaxYear() {
    return ACTIVE_TAX_YEAR;
}

function getTaxYearOptions() {
    return TAX_YEAR_OPTIONS;
}

// ========================================
// 3. CONFIG HELPER
// ========================================
let currentConfig = null;

function setCurrentConfig(config) {
    currentConfig = config;
}

function getConfig(taxYear) {
    const year = taxYear || ACTIVE_TAX_YEAR;
    if (currentConfig) return currentConfig;
    if (taxRulesCache[year]) return taxRulesCache[year];
    return FALLBACK_CONFIG[year] || FALLBACK_CONFIG['2025-26'];
}

// ========================================
// 4. TAX CALCULATION FUNCTIONS
// ========================================

function getEffectiveTaxStatus(userData) {
    if (userData.isAustralianTaxResident) {
        return 'australian';
    } else {
        if (userData.isWHMVisaHolder) {
            return 'whm';
        } else {
            return 'foreign';
        }
    }
}

function calculateLITO(taxableIncome, userData, taxYear) {
    if (!userData.isAustralianTaxResident) return 0;
    const { lito } = getConfig(taxYear);
    if (taxableIncome <= lito.tier1Max) return lito.max;
    if (taxableIncome <= lito.tier2Max) {
        return lito.max - ((taxableIncome - lito.tier1Max) * lito.tier1Rate);
    }
    if (taxableIncome <= lito.tier3Max) {
        const tier2Start = lito.max - ((lito.tier2Max - lito.tier1Max) * lito.tier1Rate);
        return tier2Start - ((taxableIncome - lito.tier2Max) * lito.tier2Rate);
    }
    return 0;
}

function calculateIncomeTax(taxableIncome, status, taxYear) {
    const config = getConfig(taxYear);
    let brackets;
    switch (status) {
        case 'whm':     brackets = config.whm; break;
        case 'foreign': brackets = config.foreign; break;
        default:        brackets = config.resident; break;
    }
    for (const bracket of brackets) {
        if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
            const excess = taxableIncome - bracket.min;
            return bracket.base + (excess * bracket.rate);
        }
    }
    return 0;
}

function calculateMedicareLevy(taxableIncome, userData, taxYear) {
    if (!userData.isAustralianTaxResident) return 0;
    if (userData.hasMedicareExemptionCertificate) return 0;
    const { medicareLevy } = getConfig(taxYear);
    if (taxableIncome <= medicareLevy.exemptThreshold) return 0;
    if (taxableIncome <= medicareLevy.shadeInThreshold) {
        return (taxableIncome - medicareLevy.exemptThreshold) * medicareLevy.shadeInRate;
    }
    return taxableIncome * medicareLevy.fullRate;
}

function calculateATI(taxableIncome, userData) {
    if (!userData.isAustralianTaxResident) return taxableIncome;

    // Temporary residents (s768-R ITAA97): foreign income is exempt from Australian tax.
    // Do not include targetForeignIncome in ATI for temporary visa holders.
    const foreignIncomeForATI = userData.isTemporaryVisaHolder
        ? 0
        : (userData.targetForeignIncome || 0);

    const ati = taxableIncome
        + (userData.fringeBenefits || 0)
        + (userData.reportableSuper || 0)
        + (userData.taxFreeGovPayments || 0)
        + foreignIncomeForATI                          // FIX: was always targetForeignIncome
        + (userData.financialInvestmentLoss || 0)
        + (Math.max(0, (userData.rentalExpenses || 0) - (userData.rentalIncome || 0)))
        - (userData.childSupportPaid || 0);

    return Math.max(0, ati);
}

// ========================================
// BUG FIX 1: calculateMLS now receives taxableIncome as an explicit parameter.
//
// BEFORE (broken):
//   function calculateMLS(userData, taxYear) {
//       const ati = calculateATI(userData.taxableIncome, userData);  // userData.taxableIncome
//                                                                     // is ALWAYS undefined —
//                                                                     // it is never stored on
//                                                                     // userData, only computed
//                                                                     // locally in calculateRefund.
//                                                                     // This made MLS always = 0.
//
// AFTER (fixed):
//   function calculateMLS(taxableIncome, userData, taxYear)
//   ATI is now calculated from the correctly computed taxableIncome
//   passed in from calculateRefund.
// ========================================
function calculateMLS(taxableIncome, userData, taxYear) {
    if (!userData.isAustralianTaxResident) return 0;

    if (userData.hasPrivateHospitalCover && (!userData.daysWithoutCover || userData.daysWithoutCover === 0)) {
        return 0;
    }

    // taxableIncome is now passed in explicitly — no more undefined read
    const ati = calculateATI(taxableIncome, userData);
    const isSingle = userData.isSingle !== undefined ? userData.isSingle : true;
    const dependentChildren = userData.dependentChildren || 0;
    const daysWithoutCover = userData.daysWithoutCover || 365;

    const fullSurcharge = calculateFullMLS(ati, isSingle, dependentChildren, taxYear);

    if (daysWithoutCover > 0 && daysWithoutCover < 365) {
        return fullSurcharge * (daysWithoutCover / 365);
    }
    return fullSurcharge;
}

function calculateFullMLS(ati, isSingle, dependentChildren, taxYear) {
    const { mls } = getConfig(taxYear);
    if (isSingle) {
        for (const t of mls.single) {
            if (ati >= t.min && ati <= t.max) return ati * t.rate;
        }
    } else {
        const extraChildren = Math.max(0, (dependentChildren || 0) - 1);
        const familyBoost = extraChildren * mls.childBoost;
        const boostedThresholds = mls.family.map(t => ({
            ...t,
            min: t.min === 0 ? 0 : t.min + familyBoost,
            max: t.max === Infinity ? Infinity : t.max + familyBoost
        }));
        for (const t of boostedThresholds) {
            if (ati >= t.min && ati <= t.max) return ati * t.rate;
        }
    }
    return 0;
}

// ========================================
// BUG FIX 2: calculateCGT now uses getEffectiveTaxStatus(userData)
//            instead of the removed userData.taxResidencyStatus field.
//
// BEFORE (broken):
//   const status = userData.taxResidencyStatus || 'australian';
//   taxResidencyStatus no longer exists on userData, so the fallback
//   'australian' always fired. Every WHM and foreign resident with a
//   capital gain incorrectly received the 50% CGT discount.
//
// AFTER (fixed):
//   const status = getEffectiveTaxStatus(userData);
//   Correctly derives 'australian' | 'foreign' | 'whm' from the
//   new boolean flags isAustralianTaxResident and isWHMVisaHolder.
// ========================================
function calculateCGT(userData) {
    const status = getEffectiveTaxStatus(userData);    // FIX: was userData.taxResidencyStatus || 'australian'

    const grossCapitalGain = userData.capitalGains || 0;
    const currentYearLosses = userData.capitalLosses || 0;
    const priorYearLosses = userData.priorYearCapitalLosses || 0;
    const netCGT = grossCapitalGain - currentYearLosses - priorYearLosses;

    if (netCGT <= 0) {
        return {
            assessableCapitalGains: 0,
            cgDiscount: 0,
            capitalLossCarryForward: Math.abs(netCGT)
        };
    }

    // 50% CGT discount: Australian residents only, assets held 12+ months
    const discountEligible = status === 'australian' && userData.cgtDiscountApplies;
    const cgDiscount = discountEligible ? netCGT * 0.5 : 0;
    const assessableCapitalGains = netCGT - cgDiscount;

    return {
        assessableCapitalGains: Math.round(assessableCapitalGains),
        cgDiscount: Math.round(cgDiscount),
        capitalLossCarryForward: 0
    };
}

function calculateTotalIncome(userData) {
    const paygIncome = (userData.employers || []).reduce((sum, e) => sum + (e.grossIncome || 0), 0);
    const interestIncome = userData.otherIncome?.interest || 0;
    const cashDividends = userData.otherIncome?.dividends || 0;
    const frankingCredits = userData.frankingCredits || 0;
    const grossedUpDividends = cashDividends + frankingCredits;
    const rentalIncome = userData.rentalIncome || 0;
    const rentalExpenses = userData.rentalExpenses || 0;
    const rentalNet = rentalIncome - rentalExpenses;
    const cgtResult = calculateCGT(userData);
    const assessableCapitalGains = cgtResult.assessableCapitalGains;
    const governmentPayments = userData.governmentPayments || 0;

    // Temporary residents (s768-R ITAA97): foreign-source income is not assessable.
    // Only include targetForeignIncome for full Australian residents (not on a temporary visa).
    const foreignIncome = (userData.isAustralianTaxResident && !userData.isTemporaryVisaHolder)
        ? (userData.targetForeignIncome || 0)
        : 0;

    const otherIncomeAmount = userData.otherIncome?.otherAmount || 0;
    const incomeBeforeRental = paygIncome + interestIncome + grossedUpDividends
        + assessableCapitalGains + governmentPayments + foreignIncome + otherIncomeAmount;

    let rentalLossUsed = 0, rentalLossCarryForward = 0;
    let totalIncome = incomeBeforeRental + rentalNet;
    if (rentalNet < 0 && totalIncome < 0) {
        rentalLossUsed = incomeBeforeRental;
        rentalLossCarryForward = Math.abs(rentalNet) - incomeBeforeRental;
        totalIncome = 0;
    } else {
        rentalLossUsed = Math.abs(rentalNet);
        rentalLossCarryForward = 0;
    }
   
    return {
        totalIncome: Math.max(0, totalIncome),
        breakdown: {
            paygIncome: Math.round(paygIncome),
            interestIncome: Math.round(interestIncome),
            grossedUpDividends: Math.round(grossedUpDividends),
            frankingCredits: Math.round(frankingCredits),
            rentalNet: Math.round(rentalNet),
            rentalLossUsed: Math.round(rentalLossUsed),
            rentalLossCarryForward: Math.round(rentalLossCarryForward),
            assessableCapitalGains: Math.round(assessableCapitalGains),
            cgDiscount: cgtResult.cgDiscount,
            capitalLossCarryForward: cgtResult.capitalLossCarryForward,
            governmentPayments: Math.round(governmentPayments),
            foreignIncome: Math.round(foreignIncome),
            otherIncome: Math.round(otherIncomeAmount)
        }
    };
}

function calculateTotalWithheld(userData) {
    return (userData.employers || []).reduce((sum, e) => sum + (e.taxWithheld || 0), 0);
}

function calculateTotalDeductions(userData) {
    return (userData.homeOffice || 0)
        + (userData.travelExpenses || 0)
        + (userData.equipment || 0)
        + (userData.selfEducation || 0)
        + (userData.otherDeductions || 0);
}

function calculateRefund(userData) {
    const taxYear = userData.taxYear || ACTIVE_TAX_YEAR;
    const effectiveStatus = getEffectiveTaxStatus(userData);

    const incomeResult = calculateTotalIncome(userData);
    const totalIncome = incomeResult.totalIncome;
    const totalDeductions = calculateTotalDeductions(userData);
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);

    const ati = calculateATI(taxableIncome, userData);
    const incomeTax = calculateIncomeTax(taxableIncome, effectiveStatus, taxYear);
    const medicareLevy = calculateMedicareLevy(taxableIncome, userData, taxYear);
    const lito = calculateLITO(taxableIncome, userData, taxYear);

    // FIX: pass taxableIncome explicitly — calculateMLS no longer reads userData.taxableIncome
    const medicareSurcharge = calculateMLS(taxableIncome, userData, taxYear);

    const totalTaxLiability = Math.max(0, incomeTax + medicareLevy + medicareSurcharge - lito);
    const totalTaxWithheld = calculateTotalWithheld(userData);
    const frankingCreditOffset = userData.frankingCredits || 0;
    const refund = totalTaxWithheld + frankingCreditOffset - totalTaxLiability;

    return {
        refund: Math.round(refund),
        taxYear,
        totalIncome: Math.round(totalIncome),
        totalDeductions: Math.round(totalDeductions),
        taxableIncome: Math.round(taxableIncome),
        ati: Math.round(ati),
        incomeTax: Math.round(incomeTax),
        medicareLevy: Math.round(medicareLevy),
        medicareSurcharge: Math.round(medicareSurcharge),
        lito: Math.round(lito),
        frankingCreditOffset: Math.round(frankingCreditOffset),
        totalTaxLiability: Math.round(totalTaxLiability),
        totalTaxWithheld: Math.round(totalTaxWithheld),
        capitalLossCarryForward: incomeResult.breakdown.capitalLossCarryForward || 0,
        rentalNet: incomeResult.breakdown.rentalNet,
        rentalLossUsed: incomeResult.breakdown.rentalLossUsed,
        rentalLossCarryForward: incomeResult.breakdown.rentalLossCarryForward,
        breakdown: incomeResult.breakdown
    };
}

// ========================================
// 5. ESTIMATE DISPLAY (debounced)
// ========================================
let estimateUpdateTimeout;
function updateEstimateAndDisplay(userData) {
    if (estimateUpdateTimeout) clearTimeout(estimateUpdateTimeout);
    estimateUpdateTimeout = setTimeout(() => {
        const calculation = calculateRefund(userData);
        const estimateElement = document.getElementById('estimateAmount');
        const hintElement = document.getElementById('estimateHint');
        const estimateBar = document.getElementById('estimateBar');
        const isWelcome = estimateBar && estimateBar.classList.contains('welcome-mode');
        if (estimateElement) {
            const refundAmount = calculation.refund;
            const formattedRefund = formatCurrency(Math.abs(refundAmount));
            estimateElement.innerHTML = refundAmount >= 0 ? formattedRefund : `-${formattedRefund}`;
            estimateElement.style.color = refundAmount >= 0 ? 'var(--accent)' : 'var(--error)';
        }
        if (hintElement) {
            if (isWelcome) {
                hintElement.style.display = 'none';
            } else {
                const income = calculation.totalIncome || 0;
                const withheld = calculation.totalTaxWithheld || 0;
                let hintText = '';
                if (income === 0 && (!userData.employers || userData.employers.length === 0)) {
                    hintText = typeof t === 'function' ? t('estimateHintDefault') : 'Your estimated return will update as you enter your income.';
                } else {
                    const template = typeof t === 'function' ? t('estimateHint') : 'Based on {income} income, {tax} withheld';
                    hintText = template.replace(/\{income\}/g, formatCurrency(income)).replace(/\{tax\}/g, formatCurrency(withheld));
                }
                hintElement.style.display = 'inline-block';
                hintElement.innerHTML = hintText;
            }
        }
    }, 200);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

// ========================================
// 6. EXPOSE PUBLIC API
// ========================================
if (typeof window !== 'undefined') {
    window.calculator = {
        loadActiveTaxYear,
        loadTaxRules,
        setActiveTaxYear,
        getActiveTaxYear,
        getTaxYearOptions,
        setCurrentConfig,
        getConfig,
        calculateRefund,
        updateEstimateAndDisplay,
        calculateIncomeTax,
        calculateMedicareLevy,
        calculateMLS,
        calculateLITO,
        calculateATI,
        calculateCGT,
        calculateTotalIncome,
        calculateTotalDeductions,
        calculateTotalWithheld,
        getEffectiveTaxStatus
    };
}

// For Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateRefund,
        updateEstimateAndDisplay,
        calculateIncomeTax,
        calculateMedicareLevy,
        calculateMLS,
        calculateLITO,
        calculateATI,
        calculateCGT,
        calculateTotalIncome,
        calculateTotalDeductions,
        calculateTotalWithheld,
        loadActiveTaxYear,
        loadTaxRules,
        getActiveTaxYear,
        getTaxYearOptions,
        setActiveTaxYear,
        setCurrentConfig,
        getConfig,
        getEffectiveTaxStatus
    };
}

// Fallback for Supabase
window.calculator = window.calculator || {};
window.calculator.getFallbackConfig = function(taxYear) {
    return FALLBACK_CONFIG[taxYear] || FALLBACK_CONFIG['2025-26'];
};
window.calculator.setCurrentConfig = function(config) {
    currentConfig = config;
};
window.calculator.setActiveTaxYear = function(year) {
    ACTIVE_TAX_YEAR = year;
};