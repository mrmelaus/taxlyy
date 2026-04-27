// screens/bas.js

function buildBas() {
  // Get data from Expenses screen (AppData)
  const confirmedExpenses = AppData.expensesConfirmed || [];
  const bankTransactions = AppData.bankTransactions || [];
  const incomeTransactions = AppData.incomeTransactions || []; // New: separate income tracking
  
  // Calculate income from bank deposits
  const bankIncome = bankTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  // Calculate income from dedicated income transactions (if any)
  const manualIncomeTotal = incomeTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  
  // Separate expenses by type (for G10 Capital purchases vs G11 Other expenses)
  const capitalPurchases = confirmedExpenses.filter(e => 
    e.category === 'Equipment' && e.amount >= 300
  );
  const otherExpenses = confirmedExpenses.filter(e => 
    !(e.category === 'Equipment' && e.amount >= 300)
  );
  
  const totalCapitalPurchases = capitalPurchases.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalOtherExpenses = otherExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpensesIncGST = totalCapitalPurchases + totalOtherExpenses;
  const totalExpensesGST = confirmedExpenses.reduce((sum, e) => sum + (e.gst || 0), 0);
  
  // Calculate missing receipts
  const missingReceiptsCount = bankTransactions.filter(tx => 
    tx.type === 'expense' && !tx.matchedToReceipt
  ).length;
  
  // Calculate GST
  const gstOnSales = (bankIncome + manualIncomeTotal) * 0.1;
  const gstOnPurchases = totalExpensesGST;
  const netGst = gstOnSales - gstOnPurchases;
  
  // Get selected period
  const selectedPeriod = AppData.selectedBasPeriod || 'jan_mar';
  const periodLabel = getPeriodLabel(selectedPeriod);
  const dueDate = getDueDate(selectedPeriod);
  const daysLeft = getDaysLeft(dueDate);
  
  // Track additional income (stored in AppData)
  const additionalIncome = AppData.additionalIncome || { cash: 0, interest: 0, other: 0, otherDesc: '' };
  const totalAdditionalIncome = (additionalIncome.cash || 0) + (additionalIncome.interest || 0) + (additionalIncome.other || 0);
  const totalSales = bankIncome + manualIncomeTotal + totalAdditionalIncome;
  const adjustedGstOnSales = totalSales * 0.1;
  const adjustedNetGst = adjustedGstOnSales - gstOnPurchases;
  
  // Calculate unmatched difference
  const unmatchedDifference = Math.abs(bankIncome - totalSales);
  const isDifferenceZero = unmatchedDifference === 0;
  
  // Get business settings (for employees, exports)
  const businessSettings = AppData.businessSettings || { hasEmployees: false, hasExports: false };
  
  // Calculate checklist progress
  const checklistItems = [
    bankTransactions.length > 0,
    confirmedExpenses.length > 0,
    missingReceiptsCount === 0,
    false, // GST fields verified (pending)
    false  // Declaration signed (pending)
  ];
  const completedCount = checklistItems.filter(item => item === true).length;
  const progressPercentage = (completedCount / checklistItems.length) * 100;
  
  // Get current date for signature
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  return `
    <div class="screen" id="screen-bas">
      ${missingReceiptsCount > 0 ? `
        <div class="marquee-container">
          <div class="marquee">
            <div class="marquee-content">
              ⚠️ ${missingReceiptsCount} bank transaction${missingReceiptsCount > 1 ? 's' : ''} missing receipt${missingReceiptsCount > 1 ? 's' : ''} — ATO requires receipts for deductions over $300
              &nbsp;&nbsp;&nbsp;→&nbsp;&nbsp;&nbsp;<a href="#" class="marquee-link" onclick="switchToExpenses(); return false;">Fix in Expenses</a>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="bas-header">
        <div>
          <div class="bas-title">BAS report — ${periodLabel}</div>
          <div class="bas-subtitle">
            <select class="period-selector" id="basPeriodSelect" onchange="changeBasPeriod(this.value)">
              <option value="jul_sep" ${selectedPeriod === 'jul_sep' ? 'selected' : ''}>Jul–Sep 2024 (Q1)</option>
              <option value="oct_dec" ${selectedPeriod === 'oct_dec' ? 'selected' : ''}>Oct–Dec 2024 (Q2)</option>
              <option value="jan_mar" ${selectedPeriod === 'jan_mar' ? 'selected' : ''}>Jan–Mar 2025 (Q3)</option>
              <option value="apr_jun" ${selectedPeriod === 'apr_jun' ? 'selected' : ''}>Apr–Jun 2025 (Q4)</option>
            </select>
            <span class="due-date">Due ${dueDate} · <span class="days-left ${daysLeft < 7 ? 'urgent' : ''}">${daysLeft} days remaining</span></span>
          </div>
        </div>
        <div class="bas-actions">
          <button class="btn btn-secondary" onclick="exportBasCSV()">📎 Download CSV</button>
          <button class="btn btn-primary" onclick="generateBasPDF()">📄 Download PDF</button>
        </div>
      </div>

      <div class="bas-two-column">
        <!-- LEFT COLUMN: Data & Confirmation -->
        <div class="bas-left">
          <!-- Reconciliation Summary Card -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">📊 Reconciliation summary</div>
              <div class="card-sub">From your bank statement and expenses</div>
            </div>
            <div class="card-body">
              <div class="reconciliation-row">
                <div class="reconciliation-label">
                  <span class="reconciliation-icon">💰</span>
                  Bank deposits
                </div>
                <div class="reconciliation-value success">
                  ${UI.currency(bankIncome)}
                  <span class="reconciliation-icon">✓</span>
                </div>
              </div>
              <div class="reconciliation-row">
                <div class="reconciliation-label">
                  <span class="reconciliation-icon">💳</span>
                  Bank expenses
                </div>
                <div class="reconciliation-value">${UI.currency(bankTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0))}</div>
              </div>
              <div class="reconciliation-divider"></div>
              <div class="reconciliation-row">
                <div class="reconciliation-label">
                  <span class="reconciliation-icon">✓</span>
                  Confirmed expenses
                </div>
                <div class="reconciliation-value success">
                  ${UI.currency(totalExpensesIncGST)}
                  <span class="reconciliation-icon">✓</span>
                </div>
              </div>
              <div class="reconciliation-row">
                <div class="reconciliation-label">
                  <span class="reconciliation-icon">📦</span>
                  Capital purchases (G10)
                </div>
                <div class="reconciliation-value">${UI.currency(totalCapitalPurchases)}</div>
              </div>
              <div class="reconciliation-row">
                <div class="reconciliation-label">
                  <span class="reconciliation-icon">📝</span>
                  Other expenses (G11)
                </div>
                <div class="reconciliation-value">${UI.currency(totalOtherExpenses)}</div>
              </div>
              <div class="reconciliation-row">
                <div class="reconciliation-label">
                  <span class="reconciliation-icon">📋</span>
                  Missing receipts
                </div>
                <div class="reconciliation-value ${missingReceiptsCount > 0 ? 'warning' : 'success'}">
                  ${missingReceiptsCount} item${missingReceiptsCount !== 1 ? 's' : ''}
                  ${missingReceiptsCount > 0 ? '<span class="reconciliation-icon">⚠️</span>' : '<span class="reconciliation-icon">✓</span>'}
                </div>
              </div>
              <div class="reconciliation-divider"></div>
              <div class="reconciliation-row">
                <div class="reconciliation-label">
                  <span class="reconciliation-icon">📊</span>
                  Unmatched difference
                </div>
                <div class="reconciliation-value ${isDifferenceZero ? 'success' : 'warning'}">
                  ${UI.currency(unmatchedDifference)}
                  ${isDifferenceZero ? '<span class="reconciliation-icon">✓</span>' : '<span class="reconciliation-icon">⚠️</span>'}
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Income Card -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">💰 Additional income</div>
              <div class="card-sub">Not in your bank statement</div>
            </div>
            <div class="card-body">
              <div class="additional-income-row">
                <div class="additional-income-check">
                  <input type="checkbox" id="cashSalesCheck" onchange="toggleCashSales()" ${additionalIncome.cash > 0 ? 'checked' : ''}>
                  <label>Cash sales</label>
                </div>
                <input type="number" id="cashSalesAmount" class="form-input cash-input" placeholder="$0.00" value="${additionalIncome.cash || ''}" step="0.01" ${additionalIncome.cash > 0 ? '' : 'disabled'}>
              </div>
              <div class="additional-income-row">
                <div class="additional-income-check">
                  <input type="checkbox" id="bankInterestCheck" onchange="toggleBankInterest()" ${additionalIncome.interest > 0 ? 'checked' : ''}>
                  <label>Bank interest</label>
                </div>
                <input type="number" id="bankInterestAmount" class="form-input cash-input" placeholder="$0.00" value="${additionalIncome.interest || ''}" step="0.01" ${additionalIncome.interest > 0 ? '' : 'disabled'}>
              </div>
              <div class="additional-income-row">
                <div class="additional-income-check">
                  <input type="checkbox" id="otherIncomeCheck" onchange="toggleOtherIncome()" ${additionalIncome.other > 0 ? 'checked' : ''}>
                  <label>Other income</label>
                </div>
                <input type="text" id="otherIncomeDesc" class="form-input" placeholder="Description" value="${additionalIncome.otherDesc || ''}" ${additionalIncome.other > 0 ? '' : 'disabled'}>
                <input type="number" id="otherIncomeAmount" class="form-input cash-input" placeholder="$0.00" value="${additionalIncome.other || ''}" step="0.01" ${additionalIncome.other > 0 ? '' : 'disabled'}>
              </div>
              <button class="btn btn-secondary btn-small" onclick="saveAdditionalIncome()" style="margin-top: 1rem; width: 100%;">
                ✓ Update BAS calculation
              </button>
              <div class="additional-income-note">
                ⚠️ ATO may ask for proof. Keep your own records.
              </div>
            </div>
          </div>

          <!-- Percentage Use Adjustments (for car, home office, etc.) -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">⚙️ Business use percentage</div>
              <div class="card-sub">Adjust for private use</div>
            </div>
            <div class="card-body">
              <div class="percentage-row">
                <label>Car / Vehicle expenses</label>
                <div class="percentage-input-group">
                  <input type="number" id="carBusinessPercent" class="form-input" value="${AppData.percentageUse?.car || 100}" step="1" min="0" max="100">
                  <span>% business use</span>
                </div>
              </div>
              <div class="percentage-row">
                <label>Home office</label>
                <div class="percentage-input-group">
                  <input type="number" id="homeOfficePercent" class="form-input" value="${AppData.percentageUse?.homeOffice || 100}" step="1" min="0" max="100">
                  <span>% business use</span>
                </div>
              </div>
              <div class="percentage-row">
                <label>Phone / Internet</label>
                <div class="percentage-input-group">
                  <input type="number" id="phonePercent" class="form-input" value="${AppData.percentageUse?.phone || 100}" step="1" min="0" max="100">
                  <span>% business use</span>
                </div>
              </div>
              <button class="btn btn-secondary btn-small" onclick="savePercentageUse()" style="margin-top: 1rem; width: 100%;">
                Apply adjustments
              </button>
            </div>
          </div>

          <!-- Additional Expenses Link -->
          <div class="card expenses-link-card">
            <div class="card-body" style="text-align: center;">
              <div class="expenses-link-icon">✏️</div>
              <div class="expenses-link-title">Need to add more expenses?</div>
              <div class="expenses-link-sub">Go to Expenses screen to upload and confirm</div>
              <button class="btn btn-primary btn-small" onclick="switchToExpenses()" style="margin-top: 0.75rem;">
                → Go to Expenses
              </button>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: BAS Draft -->
        <div class="bas-right">
          <!-- GST Summary Card -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">📋 GST summary</div>
              <div class="card-sub">Auto-calculated — review before declaring</div>
            </div>
            <div class="card-body">
              <div class="gst-horizontal">
                <!-- Sales Column -->
                <div class="gst-column">
                  <div class="gst-column-title">SALES</div>
                  <div class="gst-field">
                    <div class="gst-code">G1</div>
                    <div class="gst-desc">Total sales (including GST)</div>
                    <div class="gst-amount">${UI.currency(totalSales)}</div>
                  </div>
                  <div class="gst-field">
                    <div class="gst-code">1A</div>
                    <div class="gst-desc">GST on sales (10% of G1)</div>
                    <div class="gst-amount">${UI.currency(adjustedGstOnSales)}</div>
                  </div>
                </div>
                
                <!-- Purchases Column -->
                <div class="gst-column">
                  <div class="gst-column-title">PURCHASES</div>
                  <div class="gst-field">
                    <div class="gst-code">G10</div>
                    <div class="gst-desc">Capital purchases (>$300)</div>
                    <div class="gst-amount">${UI.currency(totalCapitalPurchases)}</div>
                  </div>
                  <div class="gst-field">
                    <div class="gst-code">G11</div>
                    <div class="gst-desc">Other expenses</div>
                    <div class="gst-amount">${UI.currency(totalOtherExpenses)}</div>
                  </div>
                  <div class="gst-field">
                    <div class="gst-code">1B</div>
                    <div class="gst-desc">GST on purchases</div>
                    <div class="gst-amount">${UI.currency(gstOnPurchases)}</div>
                  </div>
                </div>
              </div>
              
              <!-- Net GST -->
              <div class="gst-net">
                <div>
                  <div class="gst-net-label">Net GST payable to ATO</div>
                  <div class="gst-net-sub">1A minus 1B · enter this in myGov</div>
                </div>
                <div class="gst-net-amount ${adjustedNetGst > 0 ? 'payable' : 'refund'}">
                  ${adjustedNetGst > 0 ? UI.currency(adjustedNetGst) : `(${UI.currency(Math.abs(adjustedNetGst))} refund)`}
                </div>
              </div>
            </div>
          </div>

          <!-- Lodgement Checklist with Progress Bar -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">✓ Lodgement checklist</div>
            </div>
            <div class="card-body checklist-body">
              <div class="checklist-progress">
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="progress-text">${Math.round(progressPercentage)}% complete</div>
              </div>
              <div class="checklist-item ${bankTransactions.length > 0 ? 'done' : 'pending'}">
                <span class="checklist-icon">${bankTransactions.length > 0 ? '✓' : '○'}</span>
                <span>Bank statement processed</span>
              </div>
              <div class="checklist-item ${confirmedExpenses.length > 0 ? 'done' : 'pending'}">
                <span class="checklist-icon">${confirmedExpenses.length > 0 ? '✓' : '○'}</span>
                <span>${confirmedExpenses.length} expense${confirmedExpenses.length !== 1 ? 's' : ''} confirmed</span>
              </div>
              <div class="checklist-item ${missingReceiptsCount === 0 ? 'done' : 'warn'}">
                <span class="checklist-icon">${missingReceiptsCount === 0 ? '✓' : '⚠️'}</span>
                <span>Missing receipts: ${missingReceiptsCount} item${missingReceiptsCount !== 1 ? 's' : ''}</span>
              </div>
              <div class="checklist-item pending">
                <span class="checklist-icon">○</span>
                <span>GST fields verified</span>
              </div>
              <div class="checklist-item pending">
                <span class="checklist-icon">○</span>
                <span>Declaration signed</span>
              </div>
            </div>
          </div>

          <!-- Declaration Card -->
          <div class="declaration-box">
            <div class="declaration-title">📄 Declaration — required by ATO</div>
            <div class="declaration-text">The information on this activity statement is true and correct. I am authorised to make this declaration.</div>
            
            <div class="checkbox-row">
              <input type="checkbox" id="bas-dec-check" onchange="toggleDeclarationButton()">
              <label class="checkbox-label" for="bas-dec-check">
                I declare the information in this BAS is true and correct for the period ${periodLabel}
              </label>
            </div>
            
            <div class="form-group">
              <label class="form-label">Full legal name (type to sign)</label>
              <input class="form-input" id="signatureName" placeholder="e.g. Jane Louise Davidson" oninput="toggleDeclarationButton()">
              <div class="signature-date">Signed on ${formattedDate}</div>
            </div>
            
            <button class="btn btn-primary declaration-btn" id="declarationBtn" disabled style="width: 100%; justify-content: center;" onclick="confirmAndSaveBAS()">
              Confirm declaration + save BAS →
            </button>
            
            <div class="lodgement-instructions">
              <div class="lodgement-title">💡 How to lodge this BAS</div>
              <div class="lodgement-steps">
                <div>1. Download this report as PDF or CSV</div>
                <div>2. Log into myGov (ato.gov.au/mygov)</div>
                <div>3. Go to Activity statements → BAS</div>
                <div>4. Enter the amounts from G1, 1A, G11, 1B</div>
                <div>5. Submit before the due date</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// NEW FUNCTIONS FOR BAS INTEGRATION
// ============================================

// Save percentage use adjustments
function savePercentageUse() {
  const carPercent = parseFloat(document.getElementById('carBusinessPercent')?.value) || 100;
  const homeOfficePercent = parseFloat(document.getElementById('homeOfficePercent')?.value) || 100;
  const phonePercent = parseFloat(document.getElementById('phonePercent')?.value) || 100;
  
  AppData.percentageUse = {
    car: carPercent,
    homeOffice: homeOfficePercent,
    phone: phonePercent
  };
  
  // Apply adjustments to expenses
  if (AppData.expensesConfirmed) {
    AppData.expensesConfirmed = AppData.expensesConfirmed.map(expense => {
      let adjustedAmount = expense.amount;
      let adjustedGst = expense.gst;
      
      if (expense.category === 'Car' || expense.description?.toLowerCase().includes('car') || expense.description?.toLowerCase().includes('vehicle')) {
        adjustedAmount = expense.amount * (carPercent / 100);
        adjustedGst = expense.gst * (carPercent / 100);
      }
      if (expense.description?.toLowerCase().includes('phone') || expense.description?.toLowerCase().includes('internet')) {
        adjustedAmount = expense.amount * (phonePercent / 100);
        adjustedGst = expense.gst * (phonePercent / 100);
      }
      if (expense.description?.toLowerCase().includes('home office') || expense.category === 'Home office') {
        adjustedAmount = expense.amount * (homeOfficePercent / 100);
        adjustedGst = expense.gst * (homeOfficePercent / 100);
      }
      
      return {
        ...expense,
        amount: adjustedAmount,
        gst: adjustedGst
      };
    });
  }
  
  refreshBasData();
  showToast('✓ Percentage adjustments applied');
}

// Confirm and save BAS to Document Vault
function confirmAndSaveBAS() {
  const checkbox = document.getElementById('bas-dec-check');
  const signature = document.getElementById('signatureName');
  
  if (!checkbox || !checkbox.checked) {
    showToast('⚠️ Please tick the declaration checkbox');
    return;
  }
  
  if (!signature || !signature.value.trim()) {
    showToast('⚠️ Please enter your full legal name to sign');
    return;
  }
  
  // Prepare BAS data for saving
  const confirmedExpenses = AppData.expensesConfirmed || [];
  const bankTransactions = AppData.bankTransactions || [];
  
  const bankIncome = bankTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const additionalIncome = AppData.additionalIncome || { cash: 0, interest: 0, other: 0 };
  const totalAdditionalIncome = (additionalIncome.cash || 0) + (additionalIncome.interest || 0) + (additionalIncome.other || 0);
  const totalSales = bankIncome + totalAdditionalIncome;
  
  const capitalPurchases = confirmedExpenses.filter(e => e.category === 'Equipment' && e.amount >= 300);
  const otherExpenses = confirmedExpenses.filter(e => !(e.category === 'Equipment' && e.amount >= 300));
  const totalCapitalPurchases = capitalPurchases.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalOtherExpenses = otherExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpensesGST = confirmedExpenses.reduce((sum, e) => sum + (e.gst || 0), 0);
  
  const basData = {
    id: Date.now().toString(),
    period: getPeriodLabel(AppData.selectedBasPeriod),
    periodCode: AppData.selectedBasPeriod || 'jan_mar',
    year: 2025,
    generatedAt: new Date().toISOString(),
    signature: signature.value.trim(),
    g1: totalSales,
    g10: totalCapitalPurchases,
    g11: totalOtherExpenses,
    gstOnSales: totalSales * 0.1,
    gstOnPurchases: totalExpensesGST,
    netGst: (totalSales * 0.1) - totalExpensesGST,
    additionalIncome: totalAdditionalIncome,
    expensesCount: confirmedExpenses.length
  };
  
  // Save to AppData
  if (!AppData.basReports) AppData.basReports = [];
  AppData.basReports.push(basData);
  
  // Also save to Document Vault if available
  if (typeof Documents !== 'undefined' && Documents.saveBASReport) {
    Documents.saveBASReport(basData);
  }
  
  showToast('✓ BAS confirmed and saved to Document Vault');
  
  // Optionally download PDF
  generateBasPDF();
}

// Helper functions (keep existing)
function getPeriodLabel(period) {
  const periods = {
    'jul_sep': 'Jul–Sep 2024',
    'oct_dec': 'Oct–Dec 2024',
    'jan_mar': 'Jan–Mar 2025',
    'apr_jun': 'Apr–Jun 2025'
  };
  return periods[period] || 'Jan–Mar 2025';
}

function getDueDate(period) {
  const dueDates = {
    'jul_sep': '28 Oct 2024',
    'oct_dec': '28 Jan 2025',
    'jan_mar': '28 Apr 2025',
    'apr_jun': '28 Jul 2025'
  };
  return dueDates[period] || '28 Apr 2025';
}

function getDaysLeft(dueDate) {
  return 14;
}

function changeBasPeriod(period) {
  AppData.selectedBasPeriod = period;
  refreshBasData();
}

function switchToExpenses() {
  if (typeof Router !== 'undefined') {
    Router.go('expenses');
  } else {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.textContent.trim() === 'Expenses') {
        item.classList.add('active');
      }
    });
    if (typeof loadScreen === 'function') loadScreen('expenses');
  }
}

function toggleCashSales() {
  const checked = document.getElementById('cashSalesCheck')?.checked;
  const input = document.getElementById('cashSalesAmount');
  if (input) {
    input.disabled = !checked;
    if (!checked) input.value = '';
  }
}

function toggleBankInterest() {
  const checked = document.getElementById('bankInterestCheck')?.checked;
  const input = document.getElementById('bankInterestAmount');
  if (input) {
    input.disabled = !checked;
    if (!checked) input.value = '';
  }
}

function toggleOtherIncome() {
  const checked = document.getElementById('otherIncomeCheck')?.checked;
  const descInput = document.getElementById('otherIncomeDesc');
  const amountInput = document.getElementById('otherIncomeAmount');
  if (descInput) descInput.disabled = !checked;
  if (amountInput) amountInput.disabled = !checked;
  if (!checked) {
    if (descInput) descInput.value = '';
    if (amountInput) amountInput.value = '';
  }
}

function saveAdditionalIncome() {
  const cashAmount = document.getElementById('cashSalesCheck')?.checked 
    ? parseFloat(document.getElementById('cashSalesAmount')?.value) || 0 
    : 0;
  const interestAmount = document.getElementById('bankInterestCheck')?.checked 
    ? parseFloat(document.getElementById('bankInterestAmount')?.value) || 0 
    : 0;
  const otherAmount = document.getElementById('otherIncomeCheck')?.checked 
    ? parseFloat(document.getElementById('otherIncomeAmount')?.value) || 0 
    : 0;
  const otherDesc = document.getElementById('otherIncomeCheck')?.checked 
    ? document.getElementById('otherIncomeDesc')?.value || 'Other income' 
    : '';
  
  AppData.additionalIncome = {
    cash: cashAmount,
    interest: interestAmount,
    other: otherAmount,
    otherDesc: otherDesc
  };
  
  refreshBasData();
  showToast('✓ BAS calculation updated');
}

function toggleDeclarationButton() {
  const checkbox = document.getElementById('bas-dec-check');
  const signature = document.getElementById('signatureName');
  const btn = document.getElementById('declarationBtn');
  if (btn) {
    btn.disabled = !(checkbox?.checked && signature?.value.trim().length > 0);
  }
}

function exportBasCSV() {
  const confirmedExpenses = AppData.expensesConfirmed || [];
  const bankTransactions = AppData.bankTransactions || [];
  const additionalIncome = AppData.additionalIncome || { cash: 0, interest: 0, other: 0 };
  
  const bankIncome = bankTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const capitalPurchases = confirmedExpenses.filter(e => e.category === 'Equipment' && e.amount >= 300);
  const otherExpenses = confirmedExpenses.filter(e => !(e.category === 'Equipment' && e.amount >= 300));
  const totalCapitalPurchases = capitalPurchases.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalOtherExpenses = otherExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpensesGST = confirmedExpenses.reduce((sum, e) => sum + (e.gst || 0), 0);
  const totalAdditionalIncome = (additionalIncome.cash || 0) + (additionalIncome.interest || 0) + (additionalIncome.other || 0);
  const totalSales = bankIncome + totalAdditionalIncome;
  const gstOnSales = totalSales * 0.1;
  const netGst = gstOnSales - totalExpensesGST;
  
  const csvRows = [
    `BAS Report,${getPeriodLabel(AppData.selectedBasPeriod)}`,
    `Generated,${new Date().toLocaleDateString()}`,
    '',
    'Category,Amount',
    `G1 - Total sales,${totalSales.toFixed(2)}`,
    `G10 - Capital purchases,${totalCapitalPurchases.toFixed(2)}`,
    `G11 - Other expenses,${totalOtherExpenses.toFixed(2)}`,
    `1A - GST on sales,${gstOnSales.toFixed(2)}`,
    `1B - GST on purchases,${totalExpensesGST.toFixed(2)}`,
    `Net GST payable,${netGst.toFixed(2)}`,
    '',
    `Additional Income Declared,${totalAdditionalIncome.toFixed(2)}`,
    `Total Confirmed Expenses,${confirmedExpenses.length}`
  ];
  
  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `taxly_bas_${getPeriodLabel(AppData.selectedBasPeriod).replace(/ /g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓ BAS exported as CSV');
}

function generateBasPDF() {
  const checkbox = document.getElementById('bas-dec-check');
  const signature = document.getElementById('signatureName');
  
  if (!checkbox || !checkbox.checked || !signature || !signature.value.trim()) {
    showToast('⚠️ Please complete declaration first');
    return;
  }
  
  showToast('📄 PDF generation coming soon - BAS saved to Document Vault');
}

function refreshBasData() {
  const container = document.getElementById('screen-bas');
  if (container) {
    const newHtml = buildBas();
    container.outerHTML = newHtml;
  }
}

function showToast(message) {
  const existingToast = document.querySelector('.upload-success-toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'upload-success-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}