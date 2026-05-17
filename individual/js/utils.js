// ========================================
// UTILITIES - Shared helpers
// ========================================

// Current language (default: 'en') — must be on window so all files share one reference
window.currentLang = 'en';

// Translation cache (populated by supabase-config.js)
let translationCache = {};

// Set translation cache from Supabase
function setTranslationCache(cache) {
    translationCache = cache;
}

// Translation function – uses Supabase cache with fallback to static locale objects
function t(key) {
    const lang = window.currentLang || 'en'; // always read from window

    // First try Supabase cache
    if (translationCache && translationCache[key]) {
        const entry = translationCache[key];
        if (lang === 'zh') {
            if (entry.zh && entry.en && entry.zh !== entry.en) {
                return `<span class="zh">${entry.zh}</span><span class="en">${entry.en}</span>`;
            }
            return entry.zh || entry.en || key;
        }
        return entry.en || entry.zh || key;
    }

    // Fallback to static locale objects (if still present)
    const locale = lang === 'zh' ? (window.zhLocale || {}) : (window.enLocale || {});
    const value = locale[key];
    if (!value) return key;
    if (typeof value === 'object' && value.zh && value.en) {
        if (lang === 'zh') {
            return `<span class="zh">${value.zh}</span><span class="en">${value.en}</span>`;
        }
        return value.en;
    }
    return value;
}

// Bilingual version (returns object with zh/en) — only use when you explicitly need both strings
function tBilingual(key) {
    if (translationCache && translationCache[key]) {
        return { zh: translationCache[key].zh || key, en: translationCache[key].en || key };
    }
    return { zh: key, en: key };
}

// Format currency (AUD)
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Validate TFN (ATO algorithm - simple check)
function validateTFN(tfn) {
    if (!tfn) return false;
    const tfnStr = String(tfn).replace(/\s/g, '');
    if (!/^\d{8,9}$/.test(tfnStr)) return false;
    const weights = [1, 4, 3, 7, 5, 8, 6, 9, 10];
    let sum = 0;
    for (let i = 0; i < tfnStr.length; i++) {
        sum += parseInt(tfnStr[i]) * weights[i];
    }
    return sum % 11 === 0;
}

// Debounce function for real-time calculations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Save to localStorage (session only - user can refresh)
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(`taxlyy_${key}`, JSON.stringify(data));
    } catch (e) {
        console.warn('localStorage save failed', e);
    }
}

// Load from localStorage
function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(`taxlyy_${key}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.warn('localStorage load failed', e);
        return null;
    }
}

// Clear localStorage (after payment or on reset)
function clearLocalStorage() {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('taxlyy_')) {
            localStorage.removeItem(key);
        }
    });
}

// Show warning message in card
function showWarning(elementId, message, type = 'warning') {
    const container = document.getElementById(elementId);
    if (!container) return;
    const warningDiv = document.createElement('div');
    warningDiv.className = `warning-box ${type}`;
    warningDiv.innerHTML = `
        <span class="warning-icon">${type === 'error' ? '❌' : (type === 'success' ? '✓' : '⚠️')}</span>
        <span class="warning-text">${message}</span>
    `;
    const existing = container.querySelectorAll('.warning-box');
    existing.forEach(w => w.remove());
    container.prepend(warningDiv);
    if (type === 'success') {
        setTimeout(() => warningDiv.remove(), 5000);
    }
}

// Format TFN as "xxx xxx xxx" (single space)
function formatTfnDisplay(rawDigits) {
    if (!rawDigits) return '';
    const digits = rawDigits.replace(/\D/g, '');
    if (digits.length === 0) return '';
    const parts = digits.match(/(\d{1,3})/g);
    if (!parts) return '';
    return parts.join(' ').slice(0, 11);
}

// Extract raw digits from formatted TFN
function getRawTfn(formattedValue) {
    return formattedValue.replace(/\D/g, '').slice(0, 9);
}

// Format date for ATO (YYYY-MM-DD)
function formatDateForATO(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// Get current financial year
function getCurrentFinancialYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 7) {
        return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
}

// Validate DOB (DD/MM/YYYY)
function validateDOB(dateStr) {
    if (!dateStr) return false;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (month < 1 || month > 12) return false;
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) return false;
    return true;
}

function formatDateInput(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length >= 3) value = value.slice(0, 2) + '/' + value.slice(2);
    if (value.length >= 6) value = value.slice(0, 5) + '/' + value.slice(5);
    input.value = value;
}

// Validate Email
function validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return emailRegex.test(email);
}

// Normalise ABN (remove spaces)
function normaliseAbn(abn) {
    return (abn || '').replace(/[\s\u00A0\u2009\u202F]/g, '');
}

// Find existing employer by ABN
function findEmployerByAbn(abn) {
    const norm = normaliseAbn(abn);
    return userData.employers.find(emp => normaliseAbn(emp.employerAbn) === norm);
}

// Add or update employer – called from ABN lookup, OCR, manual add
window.addOrUpdateEmployer = function(employer) {
    const existing = findEmployerByAbn(employer.employerAbn);
    if (existing) {
        const msg = `An employer with ABN ${employer.employerAbn} (${existing.employerName}) already exists.\nDo you want to update the existing entry with the new figures?`;
        if (confirm(msg)) {
            existing.grossIncome = employer.grossIncome;
            existing.taxWithheld = employer.taxWithheld;
            if (employer.employerName) existing.employerName = employer.employerName;
            existing._editing = true; // open edit form for verification
            if (typeof renderEmployerList === 'function') renderEmployerList();
            if (typeof updateEstimateAndDisplay === 'function') updateEstimateAndDisplay(userData);
            //saveCurrentData();
            return { action: 'updated' };
        }
        return { action: 'cancelled' };
    }
    // No duplicate – add new
    userData.employers.push({ ...employer, _editing: true });
    if (typeof renderEmployerList === 'function') renderEmployerList();
    if (typeof updateEstimateAndDisplay === 'function') updateEstimateAndDisplay(userData);
    //saveCurrentData();
    return { action: 'added' };
};

// Strip HTML tags — use for input values and placeholders
function stripHtml(str) {
    return (str || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}


// ========================================
// Expose globals — ALL files use these directly
// ========================================
window.t = t;
window.tBilingual = tBilingual;
window.formatCurrency = formatCurrency;
window.escapeHtml = escapeHtml;
window.validateTFN = validateTFN;
window.validateEmail = validateEmail;
window.debounce = debounce;
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromLocalStorage = loadFromLocalStorage;
window.clearLocalStorage = clearLocalStorage;
window.showWarning = showWarning;
window.formatTfnDisplay = formatTfnDisplay;
window.getRawTfn = getRawTfn;
window.formatDateForATO = formatDateForATO;
window.getCurrentFinancialYear = getCurrentFinancialYear;
window.validateDOB = validateDOB;
window.formatDateInput = formatDateInput;
window.stripHtml = stripHtml;

window.utils = {
    setTranslationCache,
    t,
    tBilingual,
    formatCurrency,
    escapeHtml,
    validateTFN,
    validateEmail,
    debounce,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    showWarning,
    formatTfnDisplay,
    getRawTfn,
    formatDateForATO,
    getCurrentFinancialYear,
    validateDOB,
    currentLang: () => window.currentLang,
    setLang: (lang) => { window.currentLang = lang; }
};