// supabase-config.js
// ========================================
// Supabase data loaders — schema is set in supabase-client.js (schema: 'individual')
// so NO 'individual.' prefix on any .from() or .rpc() call here
// ========================================

window.pricing = { standard_fee: 69.99, multiple_jobs_fee: 79.99, abn_fee: 89.99 };
window.currentTaxRules = null;

async function loadPricing() {
    if (!window.supabaseClient) {
        console.warn('supabaseClient not ready, skipping loadPricing');
        return;
    }
    try {
        const { data, error } = await window.supabaseClient
            .from('pricing')
            .select('key, value');
        if (error) throw error;
        if (data && data.length) {
            data.forEach(row => { window.pricing[row.key] = row.value; });
        }
    } catch (err) {
        console.warn('Failed to load pricing, using defaults', err);
    }
}


// ========================================
// Deduction rates cache
// ========================================
window.deductionRates = { wfhRate: 0.70, travelRate: 0.88 }; // Default fallbacks

async function loadDeductionRates() {
    if (!window.supabaseClient) {
        console.warn('supabaseClient not ready, using default deduction rates');
        return window.deductionRates;
    }
    try {
        // Fetch WFH rate
        const { data: wfhData, error: wfhError } = await window.supabaseClient
            .from('app_config')
            .select('value')
            .eq('key', 'wfh_home_office_rate')
            .single();
        
        if (!wfhError && wfhData?.value) {
            window.deductionRates.wfhRate = wfhData.value.rate ?? 0.70;
        }
        
        // Fetch travel rate
        const { data: travelData, error: travelError } = await window.supabaseClient
            .from('app_config')
            .select('value')
            .eq('key', 'travel_car_rate')
            .single();
        
        if (!travelError && travelData?.value) {
            window.deductionRates.travelRate = travelData.value.rate ?? 0.88;
        }
        
        return window.deductionRates;
    } catch (err) {
        console.warn('Failed to load deduction rates, using defaults', err);
        return window.deductionRates;
    }
}

// ========================================
// Load active tax year from Supabase RPC
// ========================================
async function loadActiveTaxYear() {
    if (!window.supabaseClient) {
        console.warn('supabaseClient not ready, using fallback tax year');
        const fallback = getFallbackTaxYear();
        window.activeTaxYear = fallback;
        return fallback;
    }
    try {
        // Call the dynamic function created in Supabase
        const { data, error } = await window.supabaseClient.rpc('get_active_tax_year');
        if (error) throw error;
        window.activeTaxYear = data;   // e.g., '2025-26'
        return data;
    } catch (err) {
        console.warn('Failed to get active tax year from Supabase RPC, using fallback', err);
        const fallback = getFallbackTaxYear();
        window.activeTaxYear = fallback;
        return fallback;
    }
}

// Client‑side fallback (same logic as the Supabase function)
function getFallbackTaxYear() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1 = January, 12 = December
    // If we are in July or later (month >= 7), the most recent financial year ended on 30 June of this year.
    // Otherwise (Jan–June), the most recent financial year ended on 30 June of the previous year.
    let yearEnd = currentMonth >= 7 ? currentYear : currentYear - 1;
    // Format as "YYYY-YY" (e.g., 2024-25)
    return `${yearEnd - 1}-${String(yearEnd).slice(-2)}`;
}

async function loadTaxRules(taxYear) {
    if (!window.supabaseClient) {
        console.warn('supabaseClient not ready, skipping loadTaxRules');
        return null;
    }
    try {
        // 1. Try to fetch rules for the exact tax year
        let { data, error } = await window.supabaseClient
            .from('tax_rules')
            .select('data')
            .eq('tax_year', taxYear)
            .single();
        if (!error && data) {
            window.currentTaxRules = data.data;
            return data.data;
        }
        // 2. If not found, get the most recent tax year (largest tax_year)
        const { data: latestData, error: latestError } = await window.supabaseClient
            .from('tax_rules')
            .select('tax_year, data')
            .order('tax_year', { ascending: false })
            .limit(1);
        if (!latestError && latestData && latestData.length > 0) {
            console.warn(`Tax rules for ${taxYear} not found, using latest year ${latestData[0].tax_year} as fallback`);
            window.currentTaxRules = latestData[0].data;
            return latestData[0].data;
        }
        // 3. Ultimate fallback (should never happen if at least one row exists)
        throw new Error('No tax rules found in database');
    } catch (err) {
        console.warn(`Failed to load tax rules for ${taxYear}, using fallback`, err);
        return null;
    }
}

async function loadTranslations() {
    if (!window.supabaseClient) {
        console.warn('supabaseClient not ready, skipping loadTranslations');
        return {};
    }
    try {
        const { data, error } = await window.supabaseClient
            .from('translations')
            .select('key, en, zh');
        if (error) throw error;
        const cache = {};
        data.forEach(row => { cache[row.key] = { en: row.en, zh: row.zh }; });
        if (window.utils && window.utils.setTranslationCache) {
            window.utils.setTranslationCache(cache);
        }
        return cache;
    } catch (err) {
        console.warn('Failed to load translations, using fallback', err);
        return {};
    }
}

async function validatePromoCode(code) {
    if (!window.supabaseClient) {
        console.warn('supabaseClient not ready, skipping promo validation');
        return null;
    }
    try {
        const { data, error } = await window.supabaseClient
            .rpc('get_promo_discount', { p_code: code });
        if (error || data === null) return null;
        return data;
    } catch (err) {
        console.warn('Promo validation failed', err);
        return null;
    }
}

// ========================================
// PHI Rebate rates cache
// ========================================
window.phiRebateRates = null;

async function loadPhiRebateRates() {
    if (!window.supabaseClient) {
        console.warn('supabaseClient not ready, using fallback PHI rates');
        return getPhiRebateFallback();
    }
    try {
        const { data, error } = await window.supabaseClient
            .from('app_config')
            .select('value')
            .eq('key', 'phi_rebate_rates')
            .single();
        
        if (!error && data?.value) {
            window.phiRebateRates = data.value;
            return window.phiRebateRates;
        }
    } catch (err) {
        console.warn('Failed to load PHI rebate rates, using fallback', err);
    }
    return getPhiRebateFallback();
}

function getPhiRebateFallback() {
    return {
        '2025-26': {
            julyToMarch: {
                under65: { tier1: 0.16192, tier2: 0.08095, tier3: 0 },
                age65to69: { tier1: 0.20240, tier2: 0.12143, tier3: 0 },
                age70plus: { tier1: 0.24288, tier2: 0.16192, tier3: 0 }
            },
            aprilToJune: {
                under65: { tier1: 0.16079, tier2: 0.08038, tier3: 0 },
                age65to69: { tier1: 0.20098, tier2: 0.12058, tier3: 0 },
                age70plus: { tier1: 0.24118, tier2: 0.16079, tier3: 0 }
            }
        }
    };
}