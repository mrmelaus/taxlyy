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
            exemptThreshold: 27222,
            shadeInThreshold: 34028,
            shadeInRate: 0.10,
            fullRate: 0.02
        },
        mls: {
            single: [
                { min: 0,      max: 101000,   rate: 0 },
                { min: 101001, max: 118000,   rate: 0.01 },
                { min: 118001, max: 158000,   rate: 0.0125 },
                { min: 158001, max: Infinity, rate: 0.015 }
            ],
            family: [
                { min: 0,      max: 202000,   rate: 0 },
                { min: 202001, max: 236000,   rate: 0.01 },
                { min: 236001, max: 316000,   rate: 0.0125 },
                { min: 316001, max: Infinity, rate: 0.015 }
            ],
            childBoost: 1500
        },
        phiRebateRates: {
            julyToMarch: {
                under65:   { base: 0.24288, tier1: 0.16192, tier2: 0.08095, tier3: 0 },
                age65to69: { base: 0.28337, tier1: 0.20240, tier2: 0.12143, tier3: 0 },
                age70plus: { base: 0.32385, tier1: 0.24288, tier2: 0.16192, tier3: 0 }
            },
            aprilToJune: {
                under65:   { base: 0.24118, tier1: 0.16079, tier2: 0.08038, tier3: 0 },
                age65to69: { base: 0.28139, tier1: 0.20098, tier2: 0.12058, tier3: 0 },
                age70plus: { base: 0.32158, tier1: 0.24118, tier2: 0.16079, tier3: 0 }
            }
        },
        hecs: [
            { min: 0,      max: 67000,    rate: 0,    base: 0 },
            { min: 67001,  max: 125000,   rate: 0.15, base: 0 },
            { min: 125001, max: 179285,   rate: 0.17, base: 8700 },
            { min: 179286, max: Infinity, rate: 0.10, base: 0 }
        ]
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
    if (userData.isAustralianTaxResident === undefined) return 'australian'; // safe default for estimate
    if (userData.isAustralianTaxResident === true) return 'australian';
    if (userData.isWHMVisaHolder === true) return 'whm';
    return 'foreign';
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

// Asset type configurations with ATO effective lives (in years)
const ASSET_TYPES = {
    computer: { life: 2, label: 'Laptop / Computer' },
    tablet: { life: 2, label: 'Tablet / iPad' },
    phone: { life: 2.5, label: 'Mobile phone' },
    tools: { life: 4, label: 'Tools of trade' },
    furniture: { life: 5, label: 'Office furniture' },
    other: { life: 5, label: 'Other equipment' }
};

function getAssetEffectiveLife(assetType) {
    return ASSET_TYPES[assetType]?.life || 5;
}

function getTaxYearStartDate(taxYear) {
    const startYear = parseInt(taxYear.split('-')[0]);
    return `${startYear}-07-01`;
}

function calculateDaysHeld(purchaseDate) {
    if (!purchaseDate) return 365;
    const purchase = new Date(purchaseDate);
    const june30 = new Date(purchase.getFullYear(), 5, 30); // June 30 of purchase year
    
    if (purchase > june30) {
        // Purchased after June 30, count days to next June 30
        const nextJune30 = new Date(purchase.getFullYear() + 1, 5, 30);
        const diffTime = nextJune30 - purchase;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
        // Purchased before June 30, count days from purchase to June 30
        const diffTime = june30 - purchase;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}

function calculateNewAssetDepreciation(cost, effectiveLife, daysHeld, workPercentage) {
    // Diminishing Value method: Base × (Days held ÷ 365) × (200% ÷ Effective life) × Work %
    const dvRate = 2 / effectiveLife;
    const fullDepreciation = cost * (daysHeld / 365) * dvRate;
    return Math.round(fullDepreciation * (workPercentage / 100));
}

function calculateExistingAssetDepreciation(remainingValue, remainingLife, workPercentage) {
    // For existing assets: Remaining value × (200% ÷ Remaining life) × Work %
    const dvRate = 2 / remainingLife;
    const depreciation = remainingValue * dvRate;
    return Math.round(depreciation * (workPercentage / 100));
}

function calculateAssetDepreciation(asset, taxYear) {
    if (asset.isExisting) {
        return calculateExistingAssetDepreciation(
            asset.remainingValue,
            asset.remainingLife,
            asset.workPercentage
        );
    } else {
        const daysHeld = calculateDaysHeld(asset.purchaseDate);
        return calculateNewAssetDepreciation(
            asset.cost,
            asset.effectiveLife,
            daysHeld,
            asset.workPercentage
        );
    }
}

function calculateTotalEquipmentPreview(data) {
    const under300 = data.equipmentUnder300 || 0;
    const assets = data.equipmentAssets || [];
    let totalDepreciation = 0;
    assets.forEach(asset => {
        totalDepreciation += calculateAssetDepreciation(asset, data.taxYear);
    });
    return under300 + totalDepreciation;
}
function renderAssetItem(asset, index, taxYearStart) {
    const assetTypeOptions = Object.entries(ASSET_TYPES).map(([key, val]) => 
        `<option value="${key}" ${asset.type === key ? 'selected' : ''}>${val.label}</option>`
    ).join('');
    
    const formattedPurchaseDate = asset.purchaseDate ? formatDateForInput(asset.purchaseDate) : '';
    
    return `
        <div class="asset-item" data-index="${index}">
            <div class="asset-header">
                <div class="asset-name">${t('asset')} ${index + 1}</div>
                <button type="button" class="asset-delete-btn" data-action="delete-asset" data-index="${index}">${t('delete')}</button>
            </div>
            <div class="asset-fields-container">
                <div class="asset-field">
                    <label>${t('assetType')}</label>
                    <select class="asset-type">${assetTypeOptions}</select>
                </div>
                <div class="asset-field">
                    <label>${t('assetPurchaseDate')}</label>
                    <input type="text" class="asset-purchase-date" 
                           value="${formattedPurchaseDate}" 
                           placeholder="dd/mm/yyyy" 
                           autocomplete="off"
                           oninput="formatDateInput(this)"
                           data-fy-start="${taxYearStart}">
                    <div class="field-hint date-hint" style="display: none;"></div>
                </div>
                <div class="asset-field">
                    <label>${t('assetOriginalCost')}</label>
                    <input type="number" class="asset-original-cost" value="${asset.originalCost || 0}" step="any" min="0">
                    <div class="field-hint cost-hint" style="display: none;"></div>
                </div>
                <div class="asset-field">
                    <label>${t('assetWorkPercentage')}</label>
                    <input type="number" class="asset-work-percent" value="${asset.workPercentage || 100}" step="1" min="0" max="100">
                    <div class="field-hint">${t('assetWorkPercentageHint')}</div>
                </div>
            </div>
        </div>
    `;
}

// Calculate remaining value and remaining life at start of financial year
function calculateAssetRemainingValue(originalCost, purchaseDate, effectiveLife, fyStartDate) {
    const purchase = new Date(purchaseDate);
    const fyStart = new Date(fyStartDate);
    if (purchase >= fyStart) {
        // Asset purchased in current FY – not existing
        return { remainingValue: originalCost, remainingLife: effectiveLife, fullYearsHeld: 0 };
    }
    
    // Years held (full years) up to start of current FY
    const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
    let yearsHeld = (fyStart - purchase) / msPerYear;
    yearsHeld = Math.max(0, yearsHeld);
    const fullYearsHeld = Math.floor(yearsHeld);
    
    // Apply diminishing value for each full year
    let remaining = originalCost;
    for (let i = 0; i < fullYearsHeld; i++) {
        const dvRate = 2 / effectiveLife;
        remaining = remaining * (1 - dvRate);
    }
    remaining = Math.max(0, remaining);
    
    const remainingLife = Math.max(0.5, effectiveLife - fullYearsHeld);
    return { remainingValue: remaining, remainingLife: remainingLife, fullYearsHeld };
}

// Validate purchase date
function isValidPurchaseDate(dateStr, fyStartStr) {
    if (!dateStr) return { valid: false, error: 'missing' };
    const parts = dateStr.split('/');
    if (parts.length !== 3) return { valid: false, error: 'format' };
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return { valid: false, error: 'format' };
    if (year < 1900 || year > new Date().getFullYear()) return { valid: false, error: 'year' };
    const dateObj = new Date(year, month-1, day);
    if (dateObj > new Date()) return { valid: false, error: 'future' };
    const fyStart = new Date(fyStartStr);
    if (dateObj > fyStart) {
        // date in current FY, still valid
    }
    return { valid: true };
}

function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function parseDateFromInput(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert to YYYY-MM-DD
    }
    return dateString;
}


// Get PHI rebate tier based on income (ATO 2025-26)
function getPhiTier(income, isSingle, dependentChildren) {
    if (isSingle) {
        // Singles thresholds
        if (income <= 101000) return 'base';
        if (income <= 118000) return 'tier1';
        if (income <= 158000) return 'tier2';
        return 'tier3';
    } else {
        // Family base threshold (starts at $202,000 for 2025-26)
        let familyThreshold = 202000;
        // Add $1500 for each dependent child after the first
        const extraChildren = Math.max(0, (dependentChildren || 0) - 1);
        familyThreshold += extraChildren * 1500;
        
        if (income <= familyThreshold) return 'base';
        if (income <= familyThreshold + 34000) return 'tier1'; // 236k - 202k = 34k
        if (income <= familyThreshold + 114000) return 'tier2'; // 316k - 202k = 114k
        return 'tier3';
    }
}

// Calculate estimated PHI rebate (for preview)
function calculatePhiRebate(userData) {
    if (!userData || userData.phiRebateMethod !== 'taxtime') return 0;
    if (!userData.annualPremium || userData.annualPremium <= 0) return 0;
    if (!window.phiRebateRates) return 0;
    
    let assessableIncome = userData.taxableIncome || 0;
    if (userData.isSingle === false && userData.spouseIncome) {
        assessableIncome += userData.spouseIncome;
    }
    
    const isSingle = userData.isSingle !== undefined ? userData.isSingle : true;
    let tier = 'tier3';
    
    // Determine tier using ATO 2025-26 thresholds
    if (isSingle) {
        if (assessableIncome <= 101000) tier = 'base';
        else if (assessableIncome <= 118000) tier = 'tier1';
        else if (assessableIncome <= 158000) tier = 'tier2';
        else tier = 'tier3';
    } else {
        let familyThreshold = 202000;
        const extraChildren = Math.max(0, (userData.dependentChildren || 0) - 1);
        familyThreshold += extraChildren * 1500;
        
        if (assessableIncome <= familyThreshold) tier = 'base';
        else if (assessableIncome <= familyThreshold + 34000) tier = 'tier1';   // $236k
        else if (assessableIncome <= familyThreshold + 114000) tier = 'tier2';  // $316k
        else tier = 'tier3';
    }
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const isAprilToJune = (currentMonth >= 4 && currentMonth <= 6);
    const period = isAprilToJune ? 'aprilToJune' : 'julyToMarch';
    
    let ageGroup = 'under65';
    if (userData.dob) {
        const birthDate = new Date(userData.dob);
        let age = now.getFullYear() - birthDate.getFullYear();
        const m = now.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
        if (age >= 70) ageGroup = 'age70plus';
        else if (age >= 65) ageGroup = 'age65to69';
    }
    
    let rebateRate = 0;
    const taxYear = userData.taxYear || '2025-26';
    const periodRates = window.phiRebateRates?.[taxYear]?.[period]?.[ageGroup];
    if (periodRates) {
        if (tier === 'base') rebateRate = periodRates.base || 0;
        else if (tier === 'tier1') rebateRate = periodRates.tier1 || 0;
        else if (tier === 'tier2') rebateRate = periodRates.tier2 || 0;
        else rebateRate = periodRates.tier3 || 0;
    }
    
    return userData.annualPremium * rebateRate;
}

function getTierDisplayText(userData) {
    if (!userData || userData.phiRebateMethod !== 'taxtime') return t('notAvailable');
    
    // Calculate combined income
    let assessableIncome = userData.taxableIncome || 0;
    if (userData.isSingle === false && userData.spouseIncome) {
        assessableIncome += userData.spouseIncome;
    }
    
    const isSingle = userData.isSingle !== undefined ? userData.isSingle : true;
    let tier = 'tier3';
    let rate = 0;
    let thresholdDisplay = '';
    
    if (isSingle) {
        if (assessableIncome <= 101000) {
            tier = 'base';
            rate = 0.24288; // July-March base rate (will be adjusted in display)
            thresholdDisplay = `≤ $101,000`;
        } else if (assessableIncome <= 118000) {
            tier = 'tier1';
            rate = 0.16192;
            thresholdDisplay = `$101,001 - $118,000`;
        } else if (assessableIncome <= 158000) {
            tier = 'tier2';
            rate = 0.08095;
            thresholdDisplay = `$118,001 - $158,000`;
        } else {
            tier = 'tier3';
            rate = 0;
            thresholdDisplay = `> $158,000`;
        }
    } else {
        let familyThreshold = 202000;
        const extraChildren = Math.max(0, (userData.dependentChildren || 0) - 1);
        familyThreshold += extraChildren * 1500;
        const tier1Max = familyThreshold + 34000;   // $236k + child boost
        const tier2Max = familyThreshold + 114000;  // $316k + child boost
        
        if (assessableIncome <= familyThreshold) {
            tier = 'base';
            rate = 0.24288;
            thresholdDisplay = `≤ $${familyThreshold.toLocaleString()}`;
        } else if (assessableIncome <= tier1Max) {
            tier = 'tier1';
            rate = 0.16192;
            thresholdDisplay = `$${familyThreshold.toLocaleString()} - $${tier1Max.toLocaleString()}`;
        } else if (assessableIncome <= tier2Max) {
            tier = 'tier2';
            rate = 0.08095;
            thresholdDisplay = `$${tier1Max.toLocaleString()} - $${tier2Max.toLocaleString()}`;
        } else {
            tier = 'tier3';
            rate = 0;
            thresholdDisplay = `> $${tier2Max.toLocaleString()}`;
        }
    }
    
    // For display, use the actual rate from current period (but we simplify by showing approximate)
    // Better: get rate from window.phiRebateRates dynamically
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const isAprilToJune = (currentMonth >= 4 && currentMonth <= 6);
    const period = isAprilToJune ? 'aprilToJune' : 'julyToMarch';
    const taxYear = userData.taxYear || '2025-26';
    const ageGroup = 'under65'; // simplified for display
    const periodRates = window.phiRebateRates?.[taxYear]?.[period]?.[ageGroup];
    if (periodRates) {
        if (tier === 'base') rate = periodRates.base || 0.24288;
        else if (tier === 'tier1') rate = periodRates.tier1 || 0.16192;
        else if (tier === 'tier2') rate = periodRates.tier2 || 0.08095;
        else rate = 0;
    }
    
    const tierLabel = tier === 'base' ? t('phiRebateBaseTier') : 
                      tier === 'tier1' ? t('phiRebateTier1') : 
                      tier === 'tier2' ? t('phiRebateTier2') : t('phiRebateTier3');
    
    return `${tierLabel} (${thresholdDisplay}) → ${(rate * 100).toFixed(2)}% ${t('rebateRate')}`;
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

    // ABN income — floored at 0 (loss cannot offset PAYG — non-commercial loss rules)
    const abnGross = userData.abnIncome || 0;
    const abnExpenses = userData.abnExpenses || 0;
    const abnNet = abnGross - abnExpenses;
    const abnNetAssessable = Math.max(0, abnNet);

    const foreignIncome = (userData.isAustralianTaxResident && !userData.isTemporaryVisaHolder)
        ? (userData.targetForeignIncome || 0)
        : 0;

    const otherIncomeAmount = userData.otherIncome?.otherAmount || 0;

    // ABN net assessable now included
    const incomeBeforeRental = paygIncome + abnNetAssessable + interestIncome
        + grossedUpDividends + assessableCapitalGains + governmentPayments
        + foreignIncome + otherIncomeAmount;

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
            abnGross: Math.round(abnGross),
            abnExpenses: Math.round(abnExpenses),
            abnNet: Math.round(abnNet),
            abnNetAssessable: Math.round(abnNetAssessable),
            abnIsLoss: abnNet < 0,
            abnExceedsGstThreshold: abnGross > 75000,
            interestIncome: Math.round(interestIncome),
            dividendsCash: Math.round(cashDividends),
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
    const paygWithheld = (userData.employers || []).reduce((sum, e) => sum + (e.taxWithheld || 0), 0);
    const govWithheld = userData.govTaxWithheld || 0;
    const abnWithheld = userData.abnTaxWithheld || 0;
    return paygWithheld + govWithheld + abnWithheld;
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
    userData.taxableIncome = taxableIncome;

    const ati = calculateATI(taxableIncome, userData);
    userData.ati = ati;  // Store for HECS and other uses

    const incomeTax = calculateIncomeTax(taxableIncome, effectiveStatus, taxYear);
    const medicareLevy = calculateMedicareLevy(taxableIncome, userData, taxYear);
    const lito = calculateLITO(taxableIncome, userData, taxYear);
    const medicareSurcharge = calculateMLS(taxableIncome, userData, taxYear);
    
    const phiRebate = calculatePhiRebate(userData);
    const hecsRepayment = calculateHECSRepayment(userData); // New

    const totalTaxLiability = Math.max(0, incomeTax + medicareLevy + medicareSurcharge - lito - phiRebate + hecsRepayment);
    const totalTaxWithheld = calculateTotalWithheld(userData);
    const frankingCreditOffset = userData.frankingCredits || 0;
    const refund = totalTaxWithheld + frankingCreditOffset - totalTaxLiability;

    return {
        refund: refund,
        taxYear,
        totalIncome: Math.round(totalIncome),
        totalDeductions: Math.round(totalDeductions),
        taxableIncome: Math.round(taxableIncome),
        ati: Math.round(ati),
        incomeTax: Math.round(incomeTax),
        medicareLevy: Math.round(medicareLevy),
        medicareSurcharge: Math.round(medicareSurcharge),
        lito: Math.round(lito),
        phiRebate: Math.round(phiRebate),
        hecsRepayment: Math.round(hecsRepayment), // Added
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


function getUserAgeGroup(dob) {
    if (!dob) return 'under65';
    const age = calculateAge(dob);
    if (age < 65) return 'under65';
    if (age < 70) return 'age65to69';
    return 'age70plus';
}

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function isCurrentPeriodAprilToJune() {
    const now = new Date();
    const month = now.getMonth() + 1;
    return month >= 4 && month <= 6;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

function calculateHECSRepayment(userData) {
    if (!userData.hasHecsLoan) return 0;

    // Determine repayment income
    let repaymentIncome = userData.ati || 0;
    if (userData.hecsManualRepaymentIncome && userData.hecsManualRepaymentIncome > 0) {
        repaymentIncome = userData.hecsManualRepaymentIncome;
    }

    const taxYear = userData.taxYear || ACTIVE_TAX_YEAR;
    const config = getConfig(taxYear);
    const brackets = config?.hecs;
    
    // Safety check – if no brackets, return 0 (fallback)
    if (!brackets || !Array.isArray(brackets) || brackets.length === 0) {
        return 0;
    }

    for (const bracket of brackets) {
        if (repaymentIncome >= bracket.min && repaymentIncome <= bracket.max) {
            // If rate is 0 (first bracket), return 0
            return bracket.base + (repaymentIncome - bracket.min) * bracket.rate;
        }
    }
    return 0;
}
// ========================================
// 6. EXPOSE PUBLIC API
// ========================================
if (typeof window !== 'undefined') {
    window.calculator = {
        // Existing
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
        getEffectiveTaxStatus,
        
        // NEW: PHI Rebate functions
        calculatePhiRebate,
        getPhiTier,
        getUserAgeGroup,
        calculateAge,
        isCurrentPeriodAprilToJune,
        loadPhiRebateRates,
        getPhiRebateFallback,
        
        // NEW: Asset Depreciation functions
        getAssetEffectiveLife,
        getTaxYearStartDate,
        calculateDaysHeld,
        calculateNewAssetDepreciation,
        calculateExistingAssetDepreciation,
        calculateAssetDepreciation,
        calculateTotalEquipmentPreview,
        renderAssetItem,
        formatDateForInput,
        parseDateFromInput,
        
        // NEW: Asset types
        ASSET_TYPES
    };
}

// For Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Existing
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
        getEffectiveTaxStatus,
        
        // NEW: PHI Rebate
        calculatePhiRebate,
        getPhiTier,
        getUserAgeGroup,
        calculateAge,
        isCurrentPeriodAprilToJune,
        loadPhiRebateRates,
        getPhiRebateFallback,
        
        // NEW: Asset Depreciation
        getAssetEffectiveLife,
        getTaxYearStartDate,
        calculateDaysHeld,
        calculateNewAssetDepreciation,
        calculateExistingAssetDepreciation,
        calculateAssetDepreciation,
        calculateTotalEquipmentPreview,
        formatDateForInput,
        parseDateFromInput,
        
        // NEW: Asset types
        ASSET_TYPES
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

// Also expose individual functions globally for direct access
window.loadPhiRebateRates = loadPhiRebateRates;
window.calculatePhiRebate = calculatePhiRebate;
window.getPhiTier = getPhiTier;
window.getUserAgeGroup = getUserAgeGroup;
window.calculateAge = calculateAge;
window.isCurrentPeriodAprilToJune = isCurrentPeriodAprilToJune;
window.getPhiRebateFallback = getPhiRebateFallback;

// Asset functions
window.getAssetEffectiveLife = getAssetEffectiveLife;
window.getTaxYearStartDate = getTaxYearStartDate;
window.calculateDaysHeld = calculateDaysHeld;
window.calculateNewAssetDepreciation = calculateNewAssetDepreciation;
window.calculateExistingAssetDepreciation = calculateExistingAssetDepreciation;
window.calculateAssetDepreciation = calculateAssetDepreciation;
window.calculateTotalEquipmentPreview = calculateTotalEquipmentPreview;
window.renderAssetItem = renderAssetItem;
window.formatDateForInput = formatDateForInput;
window.parseDateFromInput = parseDateFromInput;
window.ASSET_TYPES = ASSET_TYPES;