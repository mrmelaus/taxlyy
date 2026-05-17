// app.js
// ========================================
// Orchestrator – loads data and starts the app
// ========================================

document.addEventListener('DOMContentLoaded', async () => {

    await initTracking();  

    // --- 1. Hide main UI, show loading state ---
    document.body.classList.remove('app-loaded');
    const container = document.getElementById('cardContainer');
    if (container) container.innerHTML = '';

    // --- 2. Load all dynamic data from Supabase ---
    if (typeof loadPricing === 'function') await loadPricing();

    // loadActiveTaxYear returns a string like "2025-26"
    const activeYearString = await loadActiveTaxYear();
    const parts = activeYearString.split('-');
    const startYear = parseInt(parts[0], 10);
    const activeYearEnd = startYear + 1;   // full ending year, e.g., 2026

    window.activeTaxYearString = activeYearString;   // "2025-26"
    window.activeTaxYear = activeYearEnd;            // 2026          // 2026 (for PDF, receipts, etc.)

    // loadTaxRules expects the full string "2025-26"
    await loadTaxRules(activeYearString);

    if (typeof loadTranslations === 'function') await loadTranslations();

    if (typeof loadDeductionRates === 'function') await loadDeductionRates();

    if (typeof loadPhiRebateRates === 'function') await loadPhiRebateRates();

    // --- 3. Pass loaded rules into calculator ---
    if (window.currentTaxRules) {
        window.calculator?.setCurrentConfig(window.currentTaxRules);
    }
    // Pass the string to the calculator (it expects "2025-26")
    if (window.calculator) {
        window.calculator.setActiveTaxYear(activeYearString);
    }

    // --- 4. Load saved user data ---
    //loadSavedData();

    // --- 5. Render first card ---
    renderCard();
    updateNextButtonLabel();  

    // --- 6. Attach event listeners ---
    document.getElementById('nextBtn')?.addEventListener('click', nextCard);
    document.getElementById('prevBtn')?.addEventListener('click', prevCard);
    document.getElementById('lang-en')?.addEventListener('click', () => setLanguage('en'));
    document.getElementById('lang-zh')?.addEventListener('click', () => setLanguage('zh'));

    // --- 7. Disclaimer and estimate label ---
    const disclaimerText = document.querySelector('.disclaimer-text');
    if (disclaimerText) disclaimerText.innerHTML = t('disclaimerText');

    const estimateLabel = document.getElementById('estimateLabel');
    if (estimateLabel) estimateLabel.innerHTML = t('estimatedReturn');

    // --- 8. Header scroll behaviour ---
    updateHeaderOnScroll();

    // --- 9. Reveal main UI ---
    document.body.classList.add('app-loaded');
});