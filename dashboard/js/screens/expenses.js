// screens/expenses.js

// ============================================
// UPLOAD PROGRESS UI
// Lives on body — never inside buildExpenses()
// so refreshExpensesData() can never reset it.
// Mirrors the same pattern as showToast().
// ============================================

// Import Category Guide (loaded from features/category-guide.js)
if (typeof CategoryGuide === 'undefined') {
  console.warn('CategoryGuide not loaded, using fallback');
  window.CategoryGuide = {
    isValidCategoryChange: () => true,
    showInvalidCategoryWarning: () => {},
    showATOGuide: () => {},
    getRandomTip: () => '💡 Keep all receipts for tax purposes'
  };
}
 // Global storage for phone uploads
  window._pendingPhoneUploads = window._pendingPhoneUploads || {};

function showUploadProgress(statusText, pct) {
  let panel = document.getElementById('upload-progress-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'upload-progress-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 5rem;
      right: 1.5rem;
      width: 18rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1rem;
      box-shadow: 0 0.5rem 1.5rem rgba(0,0,0,0.2);
      z-index: 1100;
      font-size: 0.75rem;
    `;
    panel.innerHTML = `
      <div id="upl-status" style="margin-bottom:0.5rem;color:var(--text2);font-weight:500;"></div>
      <div style="background:var(--border);border-radius:0.5rem;height:0.25rem;overflow:hidden;">
        <div id="upl-fill" style="background:var(--brand);height:100%;width:0%;transition:width 0.3s ease;"></div>
      </div>
      <div id="upl-detail" style="margin-top:0.375rem;color:var(--text3);"></div>
    `;
    document.body.appendChild(panel);
  }
  document.getElementById('upl-status').textContent = statusText;
  document.getElementById('upl-fill').style.width   = `${pct}%`;
}

function updateUploadDetail(text) {
  const el = document.getElementById('upl-detail');
  if (el) el.textContent = text;
}

function hideUploadProgress() {
  const panel = document.getElementById('upload-progress-panel');
  if (panel) setTimeout(() => panel.remove(), 2000);
}

// ============================================
// BUILD TEMPLATE
// No progress bar HTML here at all.
// ============================================
function buildExpenses() {
  const missingReceiptsCount = AppData.bankTransactions?.filter(tx =>
    tx.type === 'expense' && !tx.matchedToReceipt
  ).length || 0;

  const missingReceiptsList = AppData.bankTransactions?.filter(tx =>
    tx.type === 'expense' && !tx.matchedToReceipt
  ).slice(0, 5) || [];

  return `
    <div class="screen" id="screen-expenses">
      ${missingReceiptsCount > 0 ? `
        <div class="marquee-container">
          <div class="marquee">
            <div class="marquee-content">
              ⚠️ ${missingReceiptsCount} bank transaction${missingReceiptsCount > 1 ? 's' : ''} missing receipt${missingReceiptsCount > 1 ? 's' : ''} — ATO requires receipts for deductions over $300 &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
              ${missingReceiptsList.map(tx => `${tx.description} $${tx.amount.toFixed(2)}`).join(' &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; ')}
              &nbsp;&nbsp;&nbsp;→&nbsp;&nbsp;&nbsp;<a href="#" class="marquee-link" onclick="scrollToMissingReceipts(); return false;">Fix now</a>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="expenses-header">
        <div>
          <div class="expenses-title">Expenses</div>
          <div class="expenses-subtitle">Upload receipts, invoices and bank statements — AI categorises automatically</div>
        </div>
        <div class="expenses-actions">
          <select class="period-selector" id="basPeriodSelect" onchange="filterByBASPeriod(this.value)">
            <option value="current_quarter">Oct-Dec 2024 (Current quarter)</option>
            <option value="last_quarter">Jul-Sep 2024</option>
            <option value="financial_year">2024-25 Financial year</option>
            <option value="custom">Custom range</option>
          </select>
          <button class="btn btn-secondary" onclick="exportExpensesCSV()">📎 Export CSV</button>
        </div>
      </div>

      <div class="expenses-two-column">

        <!-- LEFT COLUMN - Uploads -->
        <div class="expenses-left">

          <div class="upload-zone" id="receiptUploadZone">
            <div class="upload-icon">📤</div>
            <div class="upload-title">Upload receipts</div>
            <div class="upload-sub">Drop PDF, JPG, PNG files or click to browse</div>
            <input type="file" id="fileUploadInput" multiple accept=".pdf,.jpg,.jpeg,.png" style="display: none;">
            <div class="upload-hint" onclick="document.getElementById('fileUploadInput').click()" style="cursor: pointer; font-weight: 500; padding: 8px; background: var(--surface2); border-radius: 8px; margin-top: 8px;">
              📁 Click here to select files
            </div>
            <div class="upload-hint-tip">
              💡 Supported formats: PDF, JPG, PNG (max 10MB per file)
            </div>
            <div class="upload-or">
              <span class="or-line"></span>
              <span class="or-text">OR</span>
              <span class="or-line"></span>
            </div>
            <button class="btn btn-scan" onclick="showQRModal(event)">
              📸 Scan with phone
            </button>
          </div>

          <div class="section-divider"></div>

          <div class="upload-zone" id="bankUploadZone">
            <div class="upload-icon">🏦</div>
            <div class="upload-title">Bank statement (CSV only)</div>
            <div class="upload-sub">One upload covers BAS, expenses, and annual tax</div>
            <input type="file" id="bankUploadInput" accept=".csv" style="display: none;">
            <div class="upload-hint" onclick="document.getElementById('bankUploadInput').click()">Click to upload CSV from your bank</div>
            <div class="upload-hint-tip">
              💡 CSV only — one file covers your entire BAS period
            </div>
            <div class="upload-warning">
              ⚠️ Make sure your CSV includes: Date, Description, Debit, Credit columns
            </div>
            <div class="bank-help">
              <a href="#" onclick="showBankInstructions(); return false;">How to export CSV from my bank?</a>
              &nbsp;|&nbsp;
              <a href="#" onclick="downloadCSVTemplate(); return false;">Download template</a>
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN - Needs Review + Confirmed -->
        <div class="expenses-right">
          <!-- NEEDS REVIEW SECTION -->
          <div class="needs-review-section">
            <div class="needs-review-header">
              <div class="needs-review-title">Needs review</div>
              <div class="needs-review-count">${AppData.expensesReview.length + (AppData.bankTransactions?.filter(tx => tx.type === 'expense' && !tx.reviewed)?.length || 0)} items</div>
              <button class="btn btn-small btn-ghost" onclick="approveAll()">✓ Approve all</button>
            </div>
            <div class="needs-review-list">
              
              ${AppData.expensesReview.length === 0 && (!AppData.bankTransactions || AppData.bankTransactions.filter(tx => tx.type === 'expense' && !tx.reviewed).length === 0) ? `
                <div class="empty-review-state">
                  <div>✨ All clear!</div>
                  <div class="empty-sub">No expenses need review</div>
                  
                  <!-- Complete ATO Guide - Always Visible -->
                  <div class="ato-guide-visible" style="margin-top: 24px; text-align: left;">
                    <div style="font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                      <span>📚</span> ATO Deduction Guide
                    </div>
                    
                    <!-- Categories Section -->
                    <div style="margin-bottom: 16px;">
                      <div style="font-size: 12px; font-weight: 500; margin-bottom: 8px; color: var(--text2);">📋 Categories</div>
                      <div style="display: grid; gap: 8px;">
                        <div style="font-size: 12px;"><strong>🍽️ Meals & entertainment</strong> - 50% deductible for business meals</div>
                        <div style="font-size: 12px;"><strong>✈️ Travel</strong> - 100% deductible for business travel</div>
                        <div style="font-size: 12px;"><strong>📄 Office supplies</strong> - 100% deductible</div>
                        <div style="font-size: 12px;"><strong>🖥️ Equipment</strong> - Depreciate over time</div>
                        <div style="font-size: 12px;"><strong>💻 Software & subscriptions</strong> - 100% deductible</div>
                        <div style="font-size: 12px;"><strong>📝 D5 — Other deductions</strong> - Union fees, tools under $300</div>
                        <div style="font-size: 12px;"><strong>🚫 Not deductible</strong> - Personal expenses (deleted)</div>
                      </div>
                    </div>
                    
                    <!-- Common Mistakes Section -->
                    <div style="margin-bottom: 16px;">
                      <div style="font-size: 12px; font-weight: 500; margin-bottom: 8px; color: var(--text2);">⚠️ Common Mistakes (Not Deductible)</div>
                      <div style="font-size: 11px; color: var(--text3);">
                        • Coffee, lunch, snacks (unless business meeting with client)<br>
                        • Gym memberships and fitness classes<br>
                        • Regular clothing (needs company logo or uniform)<br>
                        • Childcare and education expenses<br>
                        • Fines and penalties<br>
                        • Private portion of phone/internet (estimate 20-30% personal)
                      </div>
                    </div>
                    
                    <!-- All Tax Tips Section -->
                    <div>
                      <div style="font-size: 12px; font-weight: 500; margin-bottom: 8px; color: var(--text2);">💡 Tax Tips</div>
                      <div style="font-size: 12px; background: var(--surface2); padding: 12px; border-radius: 6px;">
                        <div style="margin-bottom: 6px;">• Keep all receipts for expenses over $10 - ATO may request evidence</div>
                        <div style="margin-bottom: 6px;">• Claim up to $300 for tools and equipment immediately (no depreciation needed)</div>
                        <div style="margin-bottom: 6px;">• Home office running costs: 67c per hour for 2024-25 financial year</div>
                        <div style="margin-bottom: 6px;">• Business meals: keep diary notes of client name and business purpose</div>
                        <div style="margin-bottom: 6px;">• Phone and internet: claim work percentage (e.g., 70% business use)</div>
                        <div style="margin-bottom: 6px;">• Assets over $300: depreciate over effective life (laptop 2-3 years)</div>
                        <div style="margin-bottom: 6px;">• Union and professional fees: fully deductible under D5 category</div>
                        <div style="margin-bottom: 6px;">• Protective gear (hard hats, safety glasses): 100% deductible</div>
                      </div>
                    </div>
                  </div>
                </div>
              ` : `
                <!-- OCR Receipt Items -->
                ${AppData.expensesReview.map((item, i) => `
                  <div class="review-item ${item.needsAttention ? 'needs-attention' : ''}" data-id="${item.id}" data-type="receipt">
                    <div class="review-item-header">
                      <div class="review-item-description">
                        <span class="review-icon">${getIconForCategory(item.aiCategory)}</span>
                        <div>
                          <div class="review-item-title">
                            ${item.description}
                            ${item.needsAttention ? '<span class="attention-badge">⚠️ Needs review</span>' : ''}
                            <span class="item-source-badge">📸 Receipt</span>
                          </div>
                          <div class="review-item-meta">${item.date} · ${UI.currencyFull(item.amount)} inc GST</div>
                          ${item.attentionReason ? `<div class="attention-reason">${item.attentionReason}</div>` : ''}
                        </div>
                      </div>
                      <div class="review-confidence ${item.confidence < 70 ? 'low' : (item.confidence < 90 ? 'medium' : 'high')}">
                        🤖 ${item.confidence || 85}% confidence
                        ${item.confidence < 70 ? '⚠️' : ''}
                      </div>
                    </div>
                    <div class="review-item-actions">
                      <select class="review-category-select" data-id="${item.id}">
                        <option value="${item.aiCategory}">${item.aiCategory}</option>
                        <option value="Meals & entertainment">🍽️ Meals & entertainment (50% deductible)</option>
                        <option value="D5 — Other deductions">📝 D5 — Other deductions</option>
                        <option value="Travel">✈️ Travel</option>
                        <option value="Office supplies">📄 Office supplies</option>
                        <option value="Software & subscriptions">💻 Software & subscriptions</option>
                        <option value="Equipment">🖥️ Equipment</option>
                        <option value="Not deductible">🚫 Not deductible</option>
                      </select>
                      <button class="btn btn-small btn-primary" onclick="confirmExpense('${item.id}')">Confirm</button>
                      <button class="btn btn-small btn-ghost" onclick="toggleEditForm('${item.id}')">Edit</button>
                    </div>
                    <div id="edit-form-${item.id}" class="edit-form-container" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);"></div>
                  </div>
                `).join('')}
                
                <!-- Bank Transaction Items -->
                ${AppData.bankTransactions && AppData.bankTransactions.filter(tx => tx.type === 'expense' && !tx.reviewed).map((tx, i) => `
                  <div class="review-item bank-transaction" data-id="${tx.id}" data-type="bank">
                    <div class="review-item-header">
                      <div class="review-item-description">
                        <span class="review-icon">🏦</span>
                        <div>
                          <div class="review-item-title">
                            ${tx.description}
                            <span class="item-source-badge">🏦 Bank</span>
                            ${!tx.matchedToReceipt ? '<span class="warning-badge">⚠️ Missing receipt</span>' : ''}
                          </div>
                          <div class="review-item-meta">${tx.date} · ${UI.currencyFull(tx.amount)}</div>
                          ${tx.amount >= 300 && tx.description.toLowerCase().match(/(computer|laptop|monitor|desk|chair|equipment)/) ? 
                            `<div class="attention-reason">💡 This may be a capital purchase (G10) - depreciable asset over $300</div>` : ''}
                        </div>
                      </div>
                    </div>
                    <div class="review-item-actions">
                      <select class="transaction-classification" data-id="${tx.id}" onchange="toggleSplitInput('${tx.id}')">
                        <option value="business">💼 Business expense (claim GST)</option>
                        <option value="drawing">👤 Owner drawing (personal, no claim)</option>
                        <option value="split">⚡ Split business/personal %</option>
                      </select>
                      <div class="split-container" id="split-container-${tx.id}" style="display: none; margin-top: 8px;">
                        <div style="display: flex; gap: 8px; align-items: center;">
                          <input type="number" id="split-percent-${tx.id}" class="form-input" placeholder="Business %" value="70" step="1" min="0" max="100" style="width: 100px;">
                          <span>% business use</span>
                          <span style="font-size: 12px; color: var(--text3);">→ Business: $${(tx.amount * 0.7).toFixed(2)}</span>
                        </div>
                        <div class="split-note" style="font-size: 11px; color: var(--text3); margin-top: 4px;">
                          Personal portion (${(100 - 70)}%) will be recorded as owner drawing
                        </div>
                      </div>
                      <div class="business-percent-note" id="percent-note-${tx.id}" style="display: none; margin-top: 8px; font-size: 12px; color: var(--text2);">
                        💡 Set business use % in Settings for recurring expenses (car, home office, phone)
                      </div>
                      <button class="btn btn-small btn-primary" onclick="confirmBankTransaction('${tx.id}')" style="margin-top: 8px;">Confirm</button>
                    </div>
                  </div>
                `).join('')}
              `}
              
            </div>
          </div>
          
          <!-- CONFIRMED EXPENSES SECTION -->
          <div class="confirmed-section">
            <div class="confirmed-header">
              <div class="confirmed-title">Confirmed expenses</div>
              <div class="filter-pills">
                <button class="filter-pill active" onclick="filterConfirmed('all')">All</button>
                <button class="filter-pill" onclick="filterConfirmed('Travel')">Travel</button>
                <button class="filter-pill" onclick="filterConfirmed('Equipment')">Equipment</button>
                <button class="filter-pill" onclick="filterConfirmed('Office')">Office</button>
                <button class="filter-pill" onclick="filterConfirmed('Software')">Software</button>
              </div>
            </div>
            <div class="confirmed-list" id="confirmedList">
              ${AppData.expensesConfirmed.length === 0 ? `
                <div class="empty-confirmed-state">
                  <div>📭 No confirmed expenses yet</div>
                  <div class="empty-sub">Upload receipts and confirm them above</div>
                </div>
              ` : AppData.expensesConfirmed.map(e => `
                <div class="confirmed-item" onclick="editExpense('${e.id}')" data-category="${e.category}">
                  <div class="confirmed-item-header">
                    <div class="confirmed-item-title">
                      <span class="confirmed-icon">${getIconForCategory(e.category)}</span>
                      <span class="confirmed-name">${e.description}</span>
                    </div>
                    <div class="confirmed-match ${e.matchStatus === 'matched' ? '' : 'missing'}">
                      ${e.matchStatus === 'matched' ? '🔒 Matched' :
                        e.matchStatus === 'receipt_only' ? '📄 Receipt only' :
                        '🏦 Missing receipt'}
                    </div>
                  </div>
                  <div class="confirmed-details">
                    ${e.date} · ${UI.currencyFull(e.amount)} inc GST · ${UI.currencyFull(e.gst)} GST
                  </div>
                  <div>
                    <span class="confirmed-category">${e.category}</span>
                    <span class="confirmed-status">${e.status}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          
          </div>

        </div>
      </div>
    </div>
  `;
}

function getIconForCategory(category) {
  const icons = {
    'Meals & entertainment': '🍽️',
    'Travel': '✈️',
    'Equipment': '🖥️',
    'Office supplies': '📄',
    'Office': '📄',
    'Software & subscriptions': '💻',
    'Software': '💻',
    'D5 — Other deductions': '📝',
    'Depreciation (Div 40)': '📉',
    'Not deductible': '🚫'
  };
  return icons[category] || '📄';
}

function refreshExpensesData() {
  const container = document.getElementById('screen-expenses');
  const parsed = new DOMParser().parseFromString(buildExpenses(), 'text/html');
  container.innerHTML = parsed.getElementById('screen-expenses').innerHTML;
  attachEventListeners();
}

// ============================================
// SAFE DOM REFRESH
// Replaces inner content only — the body-level
// progress panel and toast are untouched.
// ============================================
// ============================================
// ATTACH EVENT LISTENERS - FIXED VERSION
// ============================================
function attachEventListeners() {
  function setupFileInput() {
    const fileInput = document.getElementById('fileUploadInput');
    if (!fileInput) {
      setTimeout(setupFileInput, 100);
      return;
    }

    // No _hasListener guard — onchange is always overwritten safely,
    // and the guard was causing the race condition after DOM refreshes.
    fileInput.onchange = async (e) => {
      const files = Array.from(e.target.files);
      console.log('🔵 FILE INPUT FIRED!', files.length, 'files');

      if (files.length === 0) return;

      showUploadProgress(`Uploading 0 of ${files.length}…`, 0);

      const collected = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const pct = Math.round(((i + 0.5) / files.length) * 100);

        showUploadProgress(`Proessing... ${i + 1} of ${files.length}`, pct);
        updateUploadDetail(file.name.substring(0, 40));

        try {
          const result = await OCRProcessor.processReceipt(file);
          console.log('OCR result for', file.name, result);

          if (result && result.amount && result.amount > 0) {
            const detectedCategory = deriveCategoryFromOCR(result);
            const needsReview = needsUserConfirmation(detectedCategory, result);

            collected.push({
              id: Date.now() + Math.random(),
              description: result.merchant || file.name.replace(/\.[^/.]+$/, ''),
              date: result.date || new Date().toISOString().split('T')[0],
              amount: result.amount,
              gst: result.gst || (result.amount / 11),
              aiCategory: detectedCategory,
              confidence: needsReview ? 60 : Math.min(
                (result.confidence || 70) +
                (result.merchant ? 5 : 0) +
                (result.date ? 5 : 0),
                98
              ),
              status: 'review',
              source: file.name,
              ocrData: result,
              needsAttention: needsReview,
              attentionReason: detectedCategory === 'Meals & entertainment'
                ? '🍽️ Food expense - Check if business-related (50% deductible for business meals)'
                : null
            });
            successCount++;
            updateUploadDetail(`✓ ${file.name.substring(0, 40)}`);
          } else {
            collected.push(buildOCRFailurePlaceholder(file, 'No amount found'));
            failCount++;
            updateUploadDetail(`⚠️ No amount — ${file.name.substring(0, 35)}`);
          }
        } catch (err) {
          console.error('OCR error for', file.name, err);
          collected.push(buildOCRFailurePlaceholder(file, err.message));
          failCount++;
          updateUploadDetail(`❌ Failed — ${file.name.substring(0, 35)}`);
        }

        await new Promise(r => setTimeout(r, 250));
      }

      showUploadProgress(
        successCount > 0
          ? `✅ ${successCount} processed${failCount ? `, ⚠️ ${failCount} failed` : ''}`
          : `⚠️ OCR failed for all ${failCount} file(s)`,
        100
      );
      updateUploadDetail('');

      if (collected.length > 0) {
        AppData.expensesReview.push(...collected);
        refreshExpensesData();
      }

      hideUploadProgress();
      showToast(
        successCount > 0 && failCount === 0
          ? `✓ ${successCount} receipt${successCount > 1 ? 's' : ''} processed`
          : successCount > 0
            ? `✓ ${successCount} processed · ⚠️ ${failCount} failed`
            : `⚠️ OCR failed for ${failCount} file(s)`
      );

      // Allow same file to be uploaded again
      fileInput.value = '';
    };

    // Click handler for upload hint
    const hint = document.querySelector('#receiptUploadZone .upload-hint');
    if (hint) {
      hint.onclick = (e) => {
        e.preventDefault();
        fileInput.click();
      };
    }

    // Upload zone click — exclude scan button and hint (both handle themselves)
    const uploadZone = document.getElementById('receiptUploadZone');
    if (uploadZone) {
      uploadZone.onclick = (e) => {
        if (!e.target.closest('.btn-scan') && !e.target.closest('.upload-hint')) {
          fileInput.click();
        }
      };
    }
  }

  setupFileInput();

  // Bank CSV
  const bankInput = document.getElementById('bankUploadInput');
  if (bankInput) {
    bankInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file && typeof uploadBankStatement === 'function') uploadBankStatement(file);
    };
  }

  // Drag and drop
  const dropZone = document.getElementById('receiptUploadZone');
  if (dropZone) {
    dropZone.ondragover = (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-active');
    };
    dropZone.ondragleave = () => dropZone.classList.remove('drag-active');
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-active');
      const fileInput = document.getElementById('fileUploadInput');
      if (fileInput && fileInput.onchange) {
        fileInput.onchange({ target: { files: e.dataTransfer.files } });
      }
    };
  }
}

// NOTE: Do NOT add any auto-call block here (no DOMContentLoaded, no else attachEventListeners()).
// Your router already calls attachEventListeners() after rendering the screen.
// A second call here starts a rogue retry loop that races against the router and breaks the handler.
  
// ============================================
// HELPERS
// ============================================
// ============================================
// CATEGORY DETECTION WITH MEALS & ENTERTAINMENT
// ============================================
function deriveCategoryFromOCR(result) {
  const merchant = (result.merchant || '').toLowerCase();
  const fullText = (result.fullText || '').toLowerCase();
  
  // Food/restaurant keywords
  const foodKeywords = [
    'sushi', 'restaurant', 'cafe', 'coffee', 'lunch', 'dinner', 
    'burger', 'pizza', 'thai', 'chinese', 'mcdonald', 'kfc', 
    'subway', 'grill', 'bakery', 'pasta', 'steak', 'seafood',
    'noodle', 'curry', 'buffet', 'bistro', 'eatery'
  ];
  
  // Travel-related (accommodation, flights, transport)
  const travelKeywords = [
    'hotel', 'motel', 'airbnb', 'marriott', 'hilton', 'qantas', 
    'virgin', 'jetstar', 'taxi', 'uber', 'lyft', 'airport', 
    'booking.com', 'expedia', 'rental car', 'hertz', 'avis'
  ];
  
  // Office supplies
  const officeKeywords = ['officeworks', 'stationery', 'printer', 'paper', 'ink', 'pen', 'notebook'];
  
  // Equipment/Electronics
  const equipmentKeywords = ['jb hi-fi', 'apple', 'dell', 'lenovo', 'hp', 'microsoft', 'computer', 'laptop', 'monitor'];
  
  // Software & subscriptions
  const softwareKeywords = ['adobe', 'microsoft 365', 'google workspace', 'zoom', 'slack', 'aws', 'azure', 'cloudflare'];
  
  // Check categories in priority order
  const isFood = foodKeywords.some(keyword => merchant.includes(keyword) || fullText.includes(keyword));
  const isTravel = travelKeywords.some(keyword => merchant.includes(keyword) || fullText.includes(keyword));
  const isOffice = officeKeywords.some(keyword => merchant.includes(keyword) || fullText.includes(keyword));
  const isEquipment = equipmentKeywords.some(keyword => merchant.includes(keyword) || fullText.includes(keyword));
  const isSoftware = softwareKeywords.some(keyword => merchant.includes(keyword) || fullText.includes(keyword));
  
  if (isFood) {
    return 'Meals & entertainment';  // New category for food expenses
  }
  
  if (isTravel) {
    return 'Travel';
  }
  
  if (isOffice) {
    return 'Office supplies';
  }
  
  if (isEquipment) {
    return 'Equipment';
  }
  
  if (isSoftware) {
    return 'Software & subscriptions';
  }
  
  return 'D5 — Other deductions';
}

// Helper to check if expense needs special attention
function needsUserConfirmation(aiCategory, result) {
  // Meals & entertainment always needs confirmation (deductibility rules)
  if (aiCategory === 'Meals & entertainment') {
    return true;
  }
  
  // Low confidence items
  const merchant = (result.merchant || '').toLowerCase();
  if (merchant && merchant.length < 3) {
    return true;
  }
  
  return false;
}

function buildOCRFailurePlaceholder(file, reason) {
  return {
    id: Date.now() + Math.random(),
    description: `⚠️ OCR FAILED: ${file.name.replace(/\.[^/.]+$/, '').substring(0, 50)}`,
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    gst: 0,
    aiCategory: 'Needs review',
    confidence: 10,
    status: 'review',
    source: file.name,
    ocrError: reason || 'OCR processing failed',
    isMock: true
  };
}

function showToast(message) {
  const existing = document.querySelector('.upload-success-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'upload-success-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============================================
// QR / PHONE SCAN
// ============================================
function showQRModal(event) {
  if (event) {
    event.stopPropagation();
  }
  
  const sessionId = Math.random().toString(36).substring(7);
  
  // Your ngrok URL
  const NGROK_URL = 'https://overdeep-subhedral-kenia.ngrok-free.dev';
  const publicUrl = `${NGROK_URL}/Dashboard/phone-upload.html?session=${sessionId}&ngrok-skip-browser-warning=true`;
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicUrl)}`;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal qr-modal" style="max-width: 400px;">
      <div class="modal-header">
        <div class="modal-title">📸 Scan with phone</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div style="text-align: center;">
          <div class="qr-code-container" style="margin-bottom: 16px;">
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px;">
          </div>
          <div style="font-size: 12px; color: var(--text3); margin-bottom: 16px;">
            Scan with your phone camera
          </div>
          <div style="background: var(--surface2); padding: 8px; border-radius: 6px; font-size: 11px; word-break: break-all; margin-bottom: 16px;">
            ${publicUrl}
          </div>
          <div class="qr-instructions" style="text-align: left; font-size: 13px;">
            <p style="margin: 4px 0;">1. Open camera on your phone</p>
            <p style="margin: 4px 0;">2. Scan this QR code</p>
            <p style="margin: 4px 0;">3. Take a photo of your receipt</p>
            <p style="margin: 4px 0;">4. It will appear here automatically</p>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Start listening for uploads from this session
  listenForPhoneUpload(sessionId);
}

  function listenForPhoneUpload(sessionId) {
  console.log('🔍 Listening for phone upload, session:', sessionId);
  
  // Poll localStorage for uploads from phone
  const checkInterval = setInterval(() => {
    const key = `phone_upload_${sessionId}`;
    const storedData = localStorage.getItem(key);
    
    if (storedData) {
      console.log('📱 Phone upload detected!');
      localStorage.removeItem(key); // Clear it immediately
      
      try {
        const receiptData = JSON.parse(storedData);
        console.log('Receipt data:', receiptData);
        
        showUploadProgress('Receiving from phone...', 50);
        
        // Create new expense from phone upload
        const newReceipt = {
          id: Date.now() + Math.random(),
          description: receiptData.filename?.replace(/\.[^/.]+$/, '') || `Phone receipt ${sessionId.slice(0, 4)}`,
          date: receiptData.date || new Date().toISOString().split('T')[0],
          amount: receiptData.amount || 0,
          gst: receiptData.gst || 0,
          aiCategory: 'Meals & entertainment',
          confidence: 70,
          status: 'review',
          source: 'phone_scan',
          needsAttention: true,
          attentionReason: '📱 Scanned from phone - Please verify amount and category'
        };
        
        AppData.expensesReview.push(newReceipt);
        refreshExpensesData();
        hideUploadProgress();
        showToast(`📱 Receipt uploaded from phone: ${newReceipt.description}`);
        
        clearInterval(checkInterval);
        
      } catch (e) {
        console.error('Error parsing phone upload:', e);
      }
    }
  }, 1500); // Check every 1.5 seconds
  
  // Stop listening after 3 minutes
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('🔍 Stopped listening for session:', sessionId);
  }, 180000);
}

 // ============================================
// FILTER / EXPORT
// ============================================
function filterByBASPeriod(period) {
  console.log('Filter by period:', period);
  refreshExpensesData();
}

function exportExpensesCSV() {
  const expenses = AppData.expensesConfirmed;
  let csv = 'Description,Date,Amount,GST,Category,Match Status,Status\n';
  expenses.forEach(e => {
    csv += `"${e.description}",${e.date},${e.amount},${e.gst},${e.category},${e.matchStatus},${e.status}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `taxly_expenses_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function filterConfirmed(category) {
  const activePill = event.target;
  document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.remove('active'));
  activePill.classList.add('active');
  document.querySelectorAll('.confirmed-item').forEach(item => {
    item.style.display = (category === 'all' || item.dataset.category === category) ? '' : 'none';
  });
}


// ============================================
// Handle bank transaction confirmation with split option
// ============================================

  function toggleSplitInput(id) {
    const select = document.querySelector(`.transaction-classification[data-id="${id}"]`);
    const splitContainer = document.getElementById(`split-container-${id}`);
    const percentNote = document.getElementById(`percent-note-${id}`);
    
    if (!select) return;
    
    if (select.value === 'split') {
      if (splitContainer) splitContainer.style.display = 'block';
      if (percentNote) percentNote.style.display = 'none';
    } else if (select.value === 'business') {
      if (splitContainer) splitContainer.style.display = 'none';
      if (percentNote) percentNote.style.display = 'block';
    } else {
      if (splitContainer) splitContainer.style.display = 'none';
      if (percentNote) percentNote.style.display = 'none';
    }
  }

function confirmBankTransaction(id) {
  console.log('Confirming bank transaction:', id);
  const tx = AppData.bankTransactions.find(t => t.id == id);
  if (!tx) {
    console.error('Transaction not found:', id);
    return;
  }
  
  const select = document.querySelector(`.transaction-classification[data-id="${id}"]`);
  if (!select) {
    console.error('Classification select not found for:', id);
    return;
  }
  
  const classification = select.value;
  console.log('Classification:', classification);
  
  if (classification === 'business') {
    const newExpense = {
      id: Date.now() + Math.random(),
      description: tx.description,
      date: tx.date,
      amount: tx.amount,
      gst: tx.amount / 11,
      aiCategory: 'D5 — Other deductions',
      confidence: 100,
      status: 'confirmed',
      source: 'bank_statement',
      matchedToReceipt: tx.matchedToReceipt || false,
      category: 'D5 — Other deductions'
    };
    AppData.expensesConfirmed.push(newExpense);
    showToast(`✓ ${tx.description} added to business expenses`);
    
  } else if (classification === 'drawing') {
    if (!AppData.expensesPersonal) AppData.expensesPersonal = [];
    AppData.expensesPersonal.push({
      id: Date.now() + Math.random(),
      description: tx.description,
      date: tx.date,
      amount: tx.amount,
      type: 'drawing',
      source: 'bank_statement',
      note: 'Owner drawing - personal expense paid from business account'
    });
    showToast(`👤 ${tx.description} recorded as owner drawing (not claimable)`);
    
  } else if (classification === 'split') {
    const percentInput = document.getElementById(`split-percent-${id}`);
    const businessPercent = percentInput ? parseFloat(percentInput.value) || 70 : 70;
    const personalPercent = 100 - businessPercent;
    const businessAmount = tx.amount * (businessPercent / 100);
    const personalAmount = tx.amount * (personalPercent / 100);
    
    AppData.expensesConfirmed.push({
      id: Date.now() + Math.random(),
      description: `${tx.description} (${businessPercent}% business)`,
      date: tx.date,
      amount: businessAmount,
      gst: businessAmount / 11,
      aiCategory: 'D5 — Other deductions',
      confidence: 100,
      status: 'confirmed',
      source: 'bank_statement',
      originalAmount: tx.amount,
      businessPercent: businessPercent
    });
    
    if (!AppData.expensesPersonal) AppData.expensesPersonal = [];
    AppData.expensesPersonal.push({
      id: Date.now() + Math.random(),
      description: `${tx.description} (${personalPercent}% personal)`,
      date: tx.date,
      amount: personalAmount,
      type: 'drawing',
      source: 'bank_statement',
      originalAmount: tx.amount,
      personalPercent: personalPercent
    });
    
    showToast(`⚡ ${tx.description} split: ${businessPercent}% business, ${personalPercent}% personal`);
  }
  
  tx.reviewed = true;
  AppData.bankTransactions = AppData.bankTransactions.filter(t => t.id != id);
  refreshExpensesData();
}

// ============================================
// CONFIRM / APPROVE / SKIP / EDIT / DELETE
// ============================================
function confirmExpense(id) {
  console.log('=== CONFIRM EXPENSE CALLED ===');
  console.log('ID:', id);
  
  const expense = AppData.expensesReview.find(e => e.id == id);
  if (!expense) {
    console.error('Expense not found');
    return;
  }
  
  console.log('Expense found:', expense.description);
  console.log('Current category:', expense.aiCategory);
  
  // Get selected category from dropdown
  const selectElement = document.querySelector(`.review-category-select[data-id="${id}"]`);
  let selectedCategory = expense.aiCategory;
  
  if (selectElement) {
    selectedCategory = selectElement.value;
    console.log('Selected category from dropdown:', selectedCategory);
  }
  
  // ✅ ADD THIS VALIDATION BLOCK
  // Check if category change is allowed by ATO rules
  if (!CategoryGuide.isValidCategoryChange(expense.aiCategory, selectedCategory)) {
    CategoryGuide.showInvalidCategoryWarning(expense.aiCategory, selectedCategory, () => {
      // Open edit modal to change category
      editExpense(id);
    });
    return;
  }
  
  expense.aiCategory = selectedCategory;
  
  // Handle based on category
  if (selectedCategory === 'Not deductible') {
    console.log('Route: Non-deductible');
    showNonDeductibleWarning(expense);
  } 
  else if (selectedCategory === 'Meals & entertainment') {
    console.log('Route: Meals & entertainment');
    showMealExpensePrompt(expense);
  } 
  else {
    // All other categories (Travel, Office, Equipment, Software, D5, etc.)
    console.log('Route: Regular deductible expense');
    moveExpenseToConfirmed(expense);
  }
}
function moveExpenseToConfirmed(expense) {
  console.log('Moving to confirmed:', expense.description);
  expense.status = 'confirmed';
  expense.matchStatus = 'receipt_only';
  AppData.expensesConfirmed.push(expense);
  AppData.expensesReview = AppData.expensesReview.filter(e => e.id !== expense.id);
  refreshExpensesData();
  showToast(`✓ ${expense.description} confirmed`);
}

function handleMealDecision(id, type) {
  console.log('Meal decision:', type, 'for ID:', id);
  const expense = AppData.expensesReview.find(e => e.id == id);
  if (!expense) return;
  
  if (type === 'personal') {
    // Delete personal meal
    AppData.expensesReview = AppData.expensesReview.filter(e => e.id != id);
    refreshExpensesData();
    showToast(`🗑 Personal meal removed: ${expense.description}`);
  } else {
    // Business meal - move to confirmed
    console.log('Business meal - moving to confirmed');
    expense.status = 'confirmed';
    expense.matchStatus = 'receipt_only';
    expense.aiCategory = 'Meals & entertainment';
    AppData.expensesConfirmed.push(expense);
    AppData.expensesReview = AppData.expensesReview.filter(e => e.id != expense.id);
    refreshExpensesData();
    showToast(`✓ ${expense.description} confirmed (50% deductible)`);
  }
}

function finalizeConfirmation(expense) {
  console.log('Finalizing confirmation for:', expense.description);
  
  // Check for depreciation (if DepreciationDetector exists)
  const analysis = DepreciationDetector?.analyze(expense);
  if (analysis?.isDepreciable && analysis.confidence !== 'low') {
    showDepreciationPrompt(expense, analysis);
  } else {
    expense.status = 'confirmed';
    expense.matchStatus = 'receipt_only';
    AppData.expensesConfirmed.push(expense);
    AppData.expensesReview = AppData.expensesReview.filter(e => e.id !== expense.id);
    refreshExpensesData();
    showToast(`✓ ${expense.description} confirmed`);
  }
}

function toggleEditForm(id) {
  const container = document.getElementById(`edit-form-${id}`);
  if (!container) return;
  
  if (container.style.display === 'none') {
    // Load edit form
    const expense = AppData.expensesReview.find(e => e.id == id);
    if (expense) {
      container.innerHTML = `
        <div style="background: var(--surface2); padding: 12px; border-radius: 8px;">
          <div style="margin-bottom: 12px; font-weight: 500;">✏️ Edit Expense</div>
          <div class="form-group" style="margin-bottom: 8px;">
            <label style="font-size: 12px;">Description</label>
            <input type="text" id="edit-desc-${id}" value="${expense.description.replace(/"/g, '&quot;')}" class="form-input" style="width: 100%;">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <div class="form-group">
              <label style="font-size: 12px;">Date</label>
              <input type="date" id="edit-date-${id}" value="${expense.date}" class="form-input">
            </div>
            <div class="form-group">
              <label style="font-size: 12px;">Amount</label>
              <input type="number" id="edit-amount-${id}" value="${expense.amount}" step="0.01" class="form-input">
            </div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn btn-small btn-secondary" onclick="toggleEditForm('${id}')">Cancel</button>
            <button class="btn btn-small btn-primary" onclick="saveInlineEdit('${id}')">Save</button>
          </div>
        </div>
      `;
      container.style.display = 'block';
    }
  } else {
    container.style.display = 'none';
    container.innerHTML = '';
  }
}

function saveInlineEdit(id) {
  const expense = AppData.expensesReview.find(e => e.id == id);
  if (!expense) return;
  
  const newDesc = document.getElementById(`edit-desc-${id}`)?.value;
  const newDate = document.getElementById(`edit-date-${id}`)?.value;
  const newAmount = parseFloat(document.getElementById(`edit-amount-${id}`)?.value);
  
  if (newDesc) expense.description = newDesc;
  if (newDate) expense.date = newDate;
  if (newAmount && !isNaN(newAmount)) {
    expense.amount = newAmount;
    expense.gst = newAmount / 11;
  }
  
  // Close edit form
  toggleEditForm(id);
  
  // Refresh to show updated values
  refreshExpensesData();
  showToast(`✓ ${expense.description} updated`);
}

function showNonDeductibleWarning(expense) {
  console.log('Showing non-deductible warning for:', expense.description);
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">⚠️ Non-Deductible Expense</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 600; margin-bottom: 8px;">${expense.description}</div>
          <div style="color: var(--text3);">${expense.date} · ${UI.currencyFull(expense.amount)}</div>
        </div>
        <div style="background: var(--alert-bg); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          ⚠️ This expense is marked as <strong>NOT tax deductible</strong> (personal use).<br><br>
          Personal expenses cannot be claimed on BAS and will be <strong>DELETED</strong> from Taxlyy.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="editExpense('${expense.id}')">✏️ Edit Category</button>
        <button class="btn btn-primary" onclick="deleteExpense('${expense.id}')">🗑 Delete Expense</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function deleteExpense(id) {
  console.log('Deleting expense ID:', id);
  
  // Close modal if open
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
  
  // Find and delete from both arrays
  const expense = [...AppData.expensesReview, ...AppData.expensesConfirmed].find(e => e.id == id);
  AppData.expensesReview = AppData.expensesReview.filter(e => e.id != id);
  AppData.expensesConfirmed = AppData.expensesConfirmed.filter(e => e.id != id);
  
  refreshExpensesData();
  showToast(`🗑 Deleted ${expense?.description || 'expense'}`);
}

function showMealExpensePrompt(expense) {
  console.log('Showing meal prompt for:', expense.description);
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">🍽️ Meal Expense</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 600; margin-bottom: 8px;">${expense.description}</div>
          <div style="color: var(--text3);">${expense.date} · ${UI.currencyFull(expense.amount)}</div>
        </div>
        <div style="background: var(--alert-bg); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          <strong>Is this meal for business purposes?</strong><br><br>
          • <strong>Business meal</strong> → 50% tax deductible, appears on BAS<br>
          • <strong>Personal meal</strong> → Not deductible, will be deleted
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="handleMealDecision('${expense.id}', 'personal')">🍽️ Personal Meal</button>
        <button class="btn btn-primary" onclick="handleMealDecision('${expense.id}', 'business')">💼 Business Meal</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function handleMealDecision(id, type) {
  console.log('Meal decision:', type, 'for ID:', id);
  
  // Close modal first
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
  
  const expense = AppData.expensesReview.find(e => e.id == id);
  if (!expense) {
    console.error('Expense not found');
    return;
  }
  
  if (type === 'personal') {
    // Delete personal meal
    console.log('Deleting personal meal');
    AppData.expensesReview = AppData.expensesReview.filter(e => e.id != id);
    refreshExpensesData();
    showToast(`🗑 Personal meal removed: ${expense.description}`);
  } else {
    // Business meal - move to confirmed
    console.log('Business meal - moving to confirmed');
    expense.aiCategory = 'Meals & entertainment';
    moveExpenseToConfirmed(expense);
  }
}

function showLowConfirmationPrompt(expense) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 450px;">
      <div class="modal-header">
        <div class="modal-title">⚠️ Low Confidence Detection</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✗</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 600; margin-bottom: 8px;">${expense.description}</div>
          <div style="color: var(--text3);">${expense.date} · ${UI.currencyFull(expense.amount)}</div>
        </div>
        <div style="background: var(--gold-dim); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          🤖 OCR confidence is only ${expense.confidence}%<br><br>
          Please verify the details are correct before confirming.
        </div>
        <button class="btn btn-secondary" onclick="editExpense('${expense.id}'); this.closest('.modal-overlay').remove()" style="width: 100%;">✏️ Verify & Edit</button>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="finalizeConfirmation(expense); this.closest('.modal-overlay').remove()">✓ Looks Correct</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function showDepreciationPrompt(expense, analysis) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 450px;">
      <div class="modal-header">
        <div class="modal-title">💎 Depreciable Asset Detected</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✗</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 600; margin-bottom: 8px;">${expense.description}</div>
          <div style="color: var(--text3); font-size: 13px;">${expense.date} · ${UI.currencyFull(expense.amount)}</div>
        </div>
        <div style="background: var(--surface2); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 500; margin-bottom: 8px;">🤖 AI Analysis:</div>
          <div style="font-size: 12px; color: var(--text2);">
            ${analysis.reasons.filter(r => r !== 'No merchant information').slice(0, 2).join('<br>')}
          </div>
          ${analysis.suggestedType ? `<div style="font-size: 12px; margin-top: 8px;">Suggested asset type: <strong>${analysis.suggestedType}</strong> (${analysis.suggestedLife} years life)</div>` : ''}
        </div>
        <div class="checkbox-row" style="margin-bottom: 16px;">
          <input type="checkbox" id="depreciable-checkbox" checked style="width: 18px; height: 18px;">
          <label for="depreciable-checkbox" style="font-weight: 500;">This is a depreciable asset (move to Depreciation register)</label>
        </div>
        <div style="font-size: 12px; color: var(--text3); background: var(--gold-dim); padding: 10px; border-radius: 8px;">
          💡 If checked: This expense will NOT appear in "Confirmed expenses". It will be sent to Depreciation screen where you can set effective life, method, and business use % for annual tax deduction.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeDepreciationPrompt(this)">No, expense only</button>
        <button class="btn btn-primary" onclick="confirmDepreciableAsset('${expense.id}', this)">Yes, add to Depreciation →</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal._expense  = expense;
  modal._analysis = analysis;
}

function closeDepreciationPrompt(btn) {
  const modal = btn.closest('.modal-overlay');
  if (modal) modal.remove();
}

function confirmDepreciableAsset(id, btn) {
  const modal         = btn.closest('.modal-overlay');
  const expense       = modal._expense;
  const analysis      = modal._analysis;
  const isDepreciable = document.getElementById('depreciable-checkbox')?.checked || false;

  if (isDepreciable) {
    if (!AppData.depreciableAssets) AppData.depreciableAssets = [];
    AppData.depreciableAssets.push({
      id: 'asset-' + Date.now(),
      expenseId: expense.id,
      description: expense.description,
      purchaseDate: expense.date,
      purchaseAmount: expense.amount,
      receipt: expense.source,
      suggestedType: analysis.suggestedType,
      suggestedLife: analysis.suggestedLife,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    AppData.expensesReview = AppData.expensesReview.filter(e => e.id !== id);
    refreshExpensesData();
    showToast('✓ Added to Depreciation register. Complete asset details in Depreciation screen.');
  } else {
    expense.status      = 'confirmed';
    expense.matchStatus = 'receipt_only';
    AppData.expensesConfirmed.push(expense);
    AppData.expensesReview = AppData.expensesReview.filter(e => e.id !== id);
    refreshExpensesData();
    showToast(`✓ ${expense.description} confirmed`);
  }
  modal.remove();
}


function editExpense(id) {
  const expense = [...AppData.expensesReview, ...AppData.expensesConfirmed].find(e => e.id === id);
  if (expense) showEditModal(expense);
}
function approveAll() {
  const regularItems = [];
  const attentionItems = [];

  // --- existing receipt items ---
  for (const item of AppData.expensesReview) {
    const needsAttention =
      item.needsAttention ||
      item.aiCategory === 'Not deductible' ||
      item.aiCategory === 'Meals & entertainment' ||
      item.confidence < 70;

    if (needsAttention) {
      attentionItems.push(item);
    } else {
      regularItems.push(item);
    }
  }

  regularItems.forEach(item => {
    item.status = 'confirmed';
    item.matchStatus = 'receipt_only';
    AppData.expensesConfirmed.push(item);
  });
  AppData.expensesReview = attentionItems;

  // --- bank transactions ---
  let bankApprovedCount = 0;
  if (AppData.bankTransactions) {
    AppData.bankTransactions
      .filter(tx => tx.type === 'expense' && !tx.reviewed)
      .forEach(tx => {
        // Auto-classify as business expense
        AppData.expensesConfirmed.push({
          id: Date.now() + Math.random(),
          description: tx.description,
          date: tx.date,
          amount: tx.amount,
          gst: tx.amount / 11,
          aiCategory: 'D5 — Other deductions',
          category: 'D5 — Other deductions',
          confidence: 100,
          status: 'confirmed',
          matchStatus: 'bank_only',
          source: 'bank_statement'
        });
        tx.reviewed = true;
        bankApprovedCount++;
      });
  }

  refreshExpensesData();

  const total = regularItems.length + bankApprovedCount;
  const kept = attentionItems.length;

  if (total > 0 && kept > 0) {
    showToast(`✓ ${total} approved. ${kept} items need individual review.`);
  } else if (total > 0) {
    showToast(`✓ All ${total} items approved!`);
  } else if (kept > 0) {
    showToast(`⚠️ ${kept} items need individual review — none auto-approved.`);
  }
}

function showEditModal(expense) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Edit expense</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✗</button>
      </div>
      <div class="modal-body">
        <div class="receipt-preview">
          <div class="receipt-thumbnail">📄 ${expense.source || 'receipt.pdf'}</div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <input type="text" id="editDescription" class="form-input" value="${expense.description.replace(/"/g, '&quot;')}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="editDate" class="form-input" value="${expense.date}">
          </div>
          <div class="form-group">
            <label>Amount (inc GST)</label>
            <input type="number" id="editAmount" class="form-input" value="${expense.amount}" step="0.01">
          </div>
          <div class="form-group">
            <label>GST amount</label>
            <input type="number" id="editGST" class="form-input" value="${expense.gst}" step="0.01">
          </div>
        </div>
        <div class="form-group">
          <label>ATO category</label>
          <select id="editCategory" class="form-input">
            <option ${expense.category === 'D5 — Other deductions' ? 'selected' : ''}>D5 — Other deductions</option>
            <option ${expense.category === 'Depreciation (Div 40)' ? 'selected' : ''}>Depreciation (Div 40)</option>
            <option ${expense.category === 'Travel' ? 'selected' : ''}>Travel</option>
            <option ${expense.category === 'Office supplies' ? 'selected' : ''}>Office supplies</option>
            <option ${expense.category === 'Software & subscriptions' ? 'selected' : ''}>Software & subscriptions</option>
            <option ${expense.category === 'Not deductible' ? 'selected' : ''}>Not deductible</option>
          </select>
        </div>
        <div class="match-info">
          ${expense.matchStatus === 'matched' ? '✅ Matched to bank transaction' :
            expense.matchStatus === 'receipt_only' ? '📄 Receipt only — cash expense' :
            '🏦 Bank transaction only — add receipt for audit trail'}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-danger" onclick="deleteExpense('${expense.id}'); this.closest('.modal-overlay').remove()">Delete</button>
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="saveExpenseEdit('${expense.id}'); this.closest('.modal-overlay').remove()">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function saveExpenseEdit(id) {
  const expense = [...AppData.expensesReview, ...AppData.expensesConfirmed].find(e => e.id === id);
  if (expense) {
    expense.description = document.getElementById('editDescription').value;
    expense.date        = document.getElementById('editDate').value;
    expense.amount      = parseFloat(document.getElementById('editAmount').value);
    expense.gst         = parseFloat(document.getElementById('editGST').value);
    expense.category    = document.getElementById('editCategory').value;
    refreshExpensesData();
    showToast(`✓ ${expense.description} updated`);
  }
}

// ============================================
// BANK STATEMENT
// ============================================
function uploadBankStatement(file) {
  console.log('📁 Uploading bank statement:', file.name);
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    const lines = content.split('\n');
    
    // Detect separator
    const isTabSeparated = lines[0] && lines[0].includes('\t');
    const separator = isTabSeparated ? '\t' : ',';
    
    console.log('Separator:', separator === '\t' ? 'TAB' : 'COMMA');
    
    let expenseCount = 0;
    let incomeCount = 0;
    
    if (!AppData.bankTransactions) AppData.bankTransactions = [];
    if (!AppData.incomeTransactions) AppData.incomeTransactions = [];
    
    // Start from row 1 (skip headers)
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const cols = lines[i].split(separator);
      if (cols.length < 3) continue;
      
      // Parse date
      let date = cols[0] ? cols[0].trim() : new Date().toISOString().split('T')[0];
      
      // Parse amount
      let amountRaw = cols[1] ? cols[1].trim() : '0';
      let amount = parseFloat(amountRaw);
      
      // Get description
      let description = cols[3] || cols[4] || cols[2] || 'Unknown';
      description = description.trim();
      
      if (amount < 0) {
        // Expense (negative amount)
        expenseCount++;
        AppData.bankTransactions.push({
          id: Date.now() + Math.random() + expenseCount,
          date: date,
          description: description,
          amount: Math.abs(amount),
          type: 'expense',
          matchedToReceipt: false,
          reviewed: false
        });
      } else if (amount > 0) {
        // Income (positive amount)
        incomeCount++;
        AppData.incomeTransactions.push({
          id: Date.now() + Math.random() + incomeCount,
          date: date,
          description: description,
          amount: amount,
          type: 'income',
          reviewed: false
        });
      }
    }
    
    console.log(`✅ Processed: ${expenseCount} expenses, ${incomeCount} income`);
    console.log('First expense:', AppData.bankTransactions[0]);
    
    showToast(`📊 Bank statement loaded: ${expenseCount} expenses ready for review`);
    refreshExpensesData();
  };
  reader.readAsText(file);
}

// ============================================
// MISC
// ============================================
function scrollToMissingReceipts() {
  document.querySelector('.needs-review-section')?.scrollIntoView({ behavior: 'smooth' });
}

function showBankInstructions() {
  alert(`How to export CSV from Australian banks:\n\nCommBank: NetBank → Accounts → Export → CSV\nNAB: NAB Connect → Transactions → Export\nANZ: ANZ Internet Banking → Accounts → Download\nWestpac: Westpac Live → Accounts → Export\n\nSelect date range and choose CSV format.`);
}

function downloadCSVTemplate() {
  const template = 'Date,Description,Debit,Credit\n2024-10-01,Officeworks,49.95,\n2024-10-05,Client payment,,1250.00\n2024-10-15,Uber Business,23.50,';
  const blob = new Blob([template], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'taxly_bank_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function loadMoreExpenses() {
  console.log('Load more expenses');
}