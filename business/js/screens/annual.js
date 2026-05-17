/* ─────────────────────────────────────────
   screens/annual.js
   Annual tax report — FY 2024-25
   Scope: Sole trader (ABN income) +
          optional personal PAYG income
   ATO reference: Individual Tax Return
   Item 15 (business) + Item 1 (salary)
   2024-25 tax brackets + Medicare levy + LITO
───────────────────────────────────────── */

var ANNUAL_FY       = '2024\u201325';
var ANNUAL_FY_START = '2024-07-01';
var ANNUAL_FY_END   = '2025-06-30';
var ANNUAL_DUE_DATE = '31 October 2025';

/* ─────────────────────────────────────────
   ATO 2024-25 income tax brackets
   Resident individual rates
   Source: ato.gov.au/tax-rates-income-tax
───────────────────────────────────────── */
function calcIncomeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  var tax = 0;
  if (taxableIncome <= 18200) {
    tax = 0;
  } else if (taxableIncome <= 45000) {
    tax = (taxableIncome - 18200) * 0.19;
  } else if (taxableIncome <= 135000) {
    tax = 5092 + (taxableIncome - 45000) * 0.325;
  } else if (taxableIncome <= 190000) {
    tax = 34417 + (taxableIncome - 135000) * 0.37;
  } else {
    tax = 54817 + (taxableIncome - 190000) * 0.45;
  }
  return Math.round(tax * 100) / 100;
}

/* ─────────────────────────────────────────
   Medicare Levy — 2% above $26,000 threshold
   Phases in between $23,365 and $29,207 (2024-25)
───────────────────────────────────────── */
function calcMedicareLevy(taxableIncome) {
  if (taxableIncome <= 26000) return 0;
  return Math.round(taxableIncome * 0.02 * 100) / 100;
}

/* ─────────────────────────────────────────
   Low Income Tax Offset (LITO) 2024-25
   Max $700, phases out $37,500-$66,667
───────────────────────────────────────── */
function calcLITO(taxableIncome) {
  if (taxableIncome <= 37500) return 700;
  if (taxableIncome <= 45000) return 700 - ((taxableIncome - 37500) * 0.05);
  if (taxableIncome <= 66667) return 325 - ((taxableIncome - 45000) * 0.015);
  return 0;
}

/* ─────────────────────────────────────────
   LMITO — removed from FY 2022-23 onwards
   Do NOT include
───────────────────────────────────────── */

/* ─────────────────────────────────────────
   HECS/HELP repayment thresholds 2024-25
   Source: studyassist.gov.au
───────────────────────────────────────── */
function calcHECS(repaymentIncome) {
  var thresholds = [
    { min: 0,       max: 54435,  rate: 0     },
    { min: 54435,   max: 62738,  rate: 0.010 },
    { min: 62738,   max: 66502,  rate: 0.020 },
    { min: 66502,   max: 70469,  rate: 0.025 },
    { min: 70469,   max: 74722,  rate: 0.030 },
    { min: 74722,   max: 79206,  rate: 0.035 },
    { min: 79206,   max: 83957,  rate: 0.040 },
    { min: 83957,   max: 88936,  rate: 0.045 },
    { min: 88936,   max: 94872,  rate: 0.050 },
    { min: 94872,   max: 100560, rate: 0.055 },
    { min: 100560,  max: 107154, rate: 0.060 },
    { min: 107154,  max: 113842, rate: 0.065 },
    { min: 113842,  max: 120532, rate: 0.070 },
    { min: 120532,  max: 128224, rate: 0.075 },
    { min: 128224,  max: 999999, rate: 0.100 },
  ];
  var bracket = thresholds.find(function(t) {
    return repaymentIncome >= t.min && repaymentIncome < t.max;
  });
  if (!bracket || bracket.rate === 0) return 0;
  return Math.round(repaymentIncome * bracket.rate * 100) / 100;
}

/* ─────────────────────────────────────────
   Live income calculation from AppData
   Source of truth: bank income transactions
   + paid invoices as fallback
───────────────────────────────────────── */
function getAnnualFigures() {
  var u = AppData.annualUserInputs || {};

  /* ── Business income (ABN / Item 15) ──
     Primary: reviewed income transactions from bank CSV
     Fallback: paid invoices (ex GST)                    */
  var bankIncome = (AppData.incomeTransactions || [])
    .filter(function(tx) { return tx.reviewed !== false; })
    .reduce(function(s, tx) { return s + (tx.amount || 0); }, 0);

  var invoiceIncome = (AppData.invoices || [])
    .filter(function(inv) { return inv.status === 'paid'; })
    .reduce(function(s, inv) {
      return s + ((inv.amountIncGst || 0) - (inv.gst || 0));
    }, 0);

  /* Use bank income if bank CSV uploaded, else fall back to invoices */
  var hasBankData = (AppData.incomeTransactions || []).length > 0;
  var grossBusinessIncomeExGst = hasBankData
    ? (AppData.user.gstRegistered ? bankIncome / 1.1 : bankIncome)
    : invoiceIncome;

  /* Additional income user entered manually */
  var addl = AppData.additionalIncome || {};
  var additionalBankInterest = (AppData.incomeTransactions || [])
    .filter(function(tx) { return tx.category === 'interest'; })
    .reduce(function(s, tx) { return s + (tx.amount || 0); }, 0);

  /* ── Business deductions — grouped by ATO label ── */
  var confirmed = AppData.expensesConfirmed || [];

  function sumCategory(cats) {
    return confirmed
      .filter(function(e) {
        return cats.some(function(c) {
          return (e.category || '').toLowerCase().indexOf(c.toLowerCase()) > -1 ||
                 (e.aiCategory || '').toLowerCase().indexOf(c.toLowerCase()) > -1;
        });
      })
      .reduce(function(s, e) { return s + (e.amount || 0) - (e.gst || 0); }, 0);
  }

  var deductD1  = sumCategory(['car', 'vehicle', 'motor']);
  var deductD2  = sumCategory(['travel', 'accommodation', 'flight', 'uber', 'taxi'])
                  - deductD1; // travel minus car (car is D1)
  deductD2 = Math.max(deductD2, 0);
  var deductD4  = sumCategory(['education', 'training', 'professional development', 'course']);
  var deductD5  = sumCategory(['D5', 'office supplies', 'software', 'subscription', 'phone', 'internet', 'tools']);
  var deductMeals = sumCategory(['meals', 'entertainment']) * 0.5; // 50% rule
  var deductHomeOffice = 0;

  /* Home office — fixed rate method (67c/hr) or from confirmed expenses */
  var hoExpenses = sumCategory(['home office']);
  var hoHours    = parseFloat(u.homeOfficeHours || 0);
  if (hoHours > 0) {
    deductHomeOffice = round2a(hoHours * 0.67);
  } else {
    deductHomeOffice = hoExpenses;
  }

  /* Other business expenses — everything not caught above */
  var categorisedIds = confirmed.filter(function(e) {
    var c = (e.category || e.aiCategory || '').toLowerCase();
    return ['car','vehicle','motor','travel','accommodation','flight','uber','taxi',
            'education','training','professional development','course',
            'D5','office supplies','software','subscription','phone','internet','tools',
            'meals','entertainment','home office'].some(function(k) {
      return c.indexOf(k.toLowerCase()) > -1;
    });
  }).map(function(e) { return e.id; });

  var deductOther = confirmed
    .filter(function(e) { return categorisedIds.indexOf(e.id) === -1; })
    .reduce(function(s, e) { return s + (e.amount || 0) - (e.gst || 0); }, 0);

  /* Depreciation — live from asset register */
  var deductDepreciation = (AppData.assets || []).reduce(function(s, a) {
    if (typeof calcDepreciation === 'function') {
      return s + (calcDepreciation(a).depreciation || 0);
    }
    return s;
  }, 0);

  /* Total deductions */
  var deductions = [
    { label: 'D1 \u2014 Car & vehicle expenses',    ato: 'D1',  amount: deductD1          },
    { label: 'D2 \u2014 Work-related travel',        ato: 'D2',  amount: deductD2          },
    { label: 'D4 \u2014 Self-education expenses',    ato: 'D4',  amount: deductD4          },
    { label: 'D5 \u2014 Other work deductions',      ato: 'D5',  amount: deductD5          },
    { label: 'Meals & entertainment (50%)',           ato: 'D5',  amount: deductMeals       },
    { label: 'Home office expenses',                  ato: 'D5',  amount: deductHomeOffice  },
    { label: 'Other business expenses',               ato: 'Biz', amount: deductOther       },
    { label: 'Depreciation \u2014 Div 40',            ato: 'D',   amount: deductDepreciation},
  ].filter(function(d) { return d.amount > 0; });

  var totalDeductions = deductions.reduce(function(s, d) { return s + d.amount; }, 0);

  /* ── Net business income (Item 15) ── */
  var netBusinessIncome = Math.max(grossBusinessIncomeExGst - totalDeductions, 0);
  var businessLoss      = grossBusinessIncomeExGst < totalDeductions
    ? totalDeductions - grossBusinessIncomeExGst : 0;

  /* ── PAYG employment income (Item 1) — user entered ── */
  var paygSalary      = parseFloat(u.paygSalary || 0);
  var paygWithheld    = parseFloat(u.paygWithheld || 0);
  var otherIncome     = parseFloat(u.otherIncome || 0);
  var paygInstalments = parseFloat(u.paygInstalments || 0);

  /* ── Combined taxable income ── */
  var totalIncome    = netBusinessIncome + paygSalary + otherIncome
                       + additionalBankInterest + (addl.interest || 0);
  var taxableIncome  = Math.max(totalIncome - businessLoss, 0);

  /* ── Tax calculation ── */
  var incomeTax    = calcIncomeTax(taxableIncome);
  var medicareLevy = calcMedicareLevy(taxableIncome);
  var lito         = calcLITO(taxableIncome);
  var hecsRepay    = u.hasHECS ? calcHECS(taxableIncome) : 0;

  /* Medicare Levy Surcharge — 1% if no private health and income > $93,000 */
  var mls = (!u.hasPrivateHealth && taxableIncome > 93000)
    ? Math.round(taxableIncome * 0.01 * 100) / 100
    : 0;

  var totalTax = incomeTax + medicareLevy + mls + hecsRepay - lito;
  totalTax = Math.max(totalTax, 0);

  var credits     = paygWithheld + paygInstalments;
  var amountOwing = round2a(totalTax - credits);

  /* ── Unconfirmed warning ── */
  var pendingCount = (AppData.expensesReview || []).length;

  return {
    hasBankData:             hasBankData,
    grossBusinessIncomeExGst:round2a(grossBusinessIncomeExGst),
    deductions:              deductions.map(function(d){ return { label:d.label, ato:d.ato, amount:round2a(d.amount) }; }),
    totalDeductions:         round2a(totalDeductions),
    netBusinessIncome:       round2a(netBusinessIncome),
    businessLoss:            round2a(businessLoss),
    paygSalary:              round2a(paygSalary),
    paygWithheld:            round2a(paygWithheld),
    otherIncome:             round2a(otherIncome),
    additionalInterest:      round2a(additionalBankInterest + (addl.interest || 0)),
    taxableIncome:           round2a(taxableIncome),
    incomeTax:               round2a(incomeTax),
    medicareLevy:            round2a(medicareLevy),
    mls:                     round2a(mls),
    hecsRepay:               round2a(hecsRepay),
    lito:                    round2a(lito),
    totalTax:                round2a(totalTax),
    credits:                 round2a(credits),
    amountOwing:             round2a(amountOwing),
    pendingCount:            pendingCount,
    hasPayg:                 paygSalary > 0,
    u:                       u,
  };
}

function round2a(n) {
  return Math.round((n || 0) * 100) / 100;
}

/* ─────────────────────────────────────────
   Build screen
───────────────────────────────────────── */
function buildAnnual() {
  if (!AppData.annualUserInputs) AppData.annualUserInputs = {};
  var f = getAnnualFigures();
  var u = f.u;
  var hasPayg = u.showPayg || f.hasPayg;

  var daysLeft = Math.ceil(
    (new Date(ANNUAL_FY_END.replace('2025-06-30','2025-10-31')) - new Date()) / 86400000
  );
  /* simpler */
  var due = new Date('2025-10-31');
  var now = new Date();
  daysLeft = Math.max(Math.ceil((due - now) / 86400000), 0);

  return `
    <div class="screen" id="screen-annual">

      <!-- ── Header ── -->
      <div class="annual-header">
        <div>
          <div class="annual-title">Annual tax report — FY ${ANNUAL_FY}</div>
          <div class="annual-subtitle">
            1 Jul 2024 – 30 Jun 2025 · Self-lodgement due ${ANNUAL_DUE_DATE}
            <span class="annual-days-badge ${daysLeft < 30 ? 'urgent' : ''}">
              ${daysLeft} days remaining
            </span>
          </div>
        </div>
        <div class="annual-header-actions">
          <button class="btn btn-ghost" onclick="exportAnnualCSV()">📎 Export CSV</button>
          <button class="btn btn-ghost" onclick="openMyTaxGuide()">📋 myTax guide</button>
          <button class="btn btn-primary" onclick="printAnnualReport()">Download PDF →</button>
        </div>
      </div>

      <!-- ── Data source notice ── -->
      ${!f.hasBankData ? `
        <div class="annual-notice annual-notice--warning">
          <span class="annual-notice-icon">⚠️</span>
          <div>
            <strong>No bank statement uploaded yet.</strong>
            Income is estimated from paid invoices only. Upload your bank CSV in Expenses
            for a more accurate figure.
            <a href="#" onclick="Router.go('expenses');return false;" style="color:var(--brand);margin-left:6px">
              Go to Expenses →
            </a>
          </div>
        </div>
      ` : ''}

      ${f.pendingCount > 0 ? `
        <div class="annual-notice annual-notice--info">
          <span class="annual-notice-icon">🗂</span>
          <div>
            <strong>${f.pendingCount} expense${f.pendingCount > 1 ? 's' : ''} still need review</strong>
            and are not included in your deductions.
            <a href="#" onclick="Router.go('expenses');return false;" style="color:var(--brand);margin-left:6px">
              Review now →
            </a>
          </div>
        </div>
      ` : ''}

      <!-- ── Stat cards ── -->
      <div class="stats-grid annual-stats">
        ${UI.statCard({ label:'Gross ABN income',    value: UI.currencyFull(f.grossBusinessIncomeExGst), change: f.hasBankData ? 'From bank statement' : 'From paid invoices', changeType:'up', variant:'positive' })}
        ${UI.statCard({ label:'Total deductions',    value: UI.currencyFull(f.totalDeductions),  change: f.deductions.length + ' categories confirmed' })}
        ${UI.statCard({ label:'Net business income', value: UI.currencyFull(f.netBusinessIncome), change: 'Item 15 — myTax', variant: f.businessLoss > 0 ? 'alert' : 'positive' })}
        ${UI.statCard({ label:'Est. tax payable',    value: UI.currencyFull(f.totalTax),  change: f.amountOwing > 0 ? 'Owing: ' + UI.currencyFull(f.amountOwing) : 'Refund: ' + UI.currencyFull(Math.abs(f.amountOwing)), changeType: f.amountOwing > 0 ? 'warn' : 'up', variant: f.amountOwing > 0 ? 'warning' : 'positive' })}
      </div>

      <!-- ── Main two-column layout ── -->
      <div class="annual-two-col">

        <!-- LEFT — P&L + inputs -->
        <div class="annual-left">

          <!-- ── P&L card ── -->
          <div class="card annual-card">
            <div class="card-header">
              <div class="card-title">Profit &amp; loss — business (ABN)</div>
              <div class="card-sub">Ex GST · FY ${ANNUAL_FY}</div>
            </div>
            <div class="card-body annual-pl-body">

              <!-- Income row -->
              <div class="annual-pl-section-label">INCOME</div>
              <div class="annual-pl-row">
                <div class="annual-pl-label">
                  Gross ABN receipts
                  <span class="annual-ato-badge">Item 15</span>
                </div>
                <div class="annual-pl-amount annual-pl-amount--income">
                  ${UI.currencyFull(f.grossBusinessIncomeExGst)}
                </div>
              </div>

              ${f.additionalInterest > 0 ? `
                <div class="annual-pl-row">
                  <div class="annual-pl-label">
                    Bank interest
                    <span class="annual-ato-badge">Item 10</span>
                  </div>
                  <div class="annual-pl-amount annual-pl-amount--income">
                    ${UI.currencyFull(f.additionalInterest)}
                  </div>
                </div>
              ` : ''}

              <!-- Deductions -->
              ${f.deductions.length > 0 ? `
                <div class="annual-pl-divider"></div>
                <div class="annual-pl-section-label">DEDUCTIONS</div>
                ${f.deductions.map(function(d) { return `
                  <div class="annual-pl-row">
                    <div class="annual-pl-label">
                      ${d.label}
                      <span class="annual-ato-badge">${d.ato}</span>
                    </div>
                    <div class="annual-pl-amount annual-pl-amount--deduct">
                      – ${UI.currencyFull(d.amount)}
                    </div>
                  </div>
                `; }).join('')}
              ` : `
                <div class="annual-empty-deductions">
                  No confirmed deductions yet.
                  <a href="#" onclick="Router.go('expenses');return false;">Add expenses →</a>
                </div>
              `}

              <div class="annual-pl-divider"></div>

              <!-- Net -->
              <div class="annual-pl-row annual-pl-row--total">
                <div>Net business income <span style="color:var(--text3);font-weight:400">(Item 15P)</span></div>
                <div class="annual-pl-amount ${f.businessLoss > 0 ? 'annual-pl-amount--loss' : 'annual-pl-amount--net'}">
                  ${f.businessLoss > 0
                    ? '(' + UI.currencyFull(f.businessLoss) + ') loss'
                    : UI.currencyFull(f.netBusinessIncome)
                  }
                </div>
              </div>

            </div>
          </div>

          <!-- ── PAYG toggle ── -->
          <div class="card annual-card">
            <div class="card-header">
              <div>
                <div class="card-title">💼 Employment income (optional)</div>
                <div class="card-sub">Did you also have a job (PAYG) this financial year?</div>
              </div>
              <label class="annual-toggle-wrap">
                <input type="checkbox" id="annual-payg-toggle"
                  ${hasPayg ? 'checked' : ''}
                  onchange="toggleAnnualPayg(this.checked)"
                  style="accent-color:var(--brand);width:18px;height:18px;cursor:pointer" />
                <span style="font-size:var(--text-sm);color:var(--text2);margin-left:8px">Yes, I had a job</span>
              </label>
            </div>

            <div id="annual-payg-section" style="display:${hasPayg ? 'block' : 'none'}">
              <div class="card-body">
                <div class="annual-notice annual-notice--tip" style="margin-bottom:16px">
                  💡 Find these figures in your <strong>Income Statement</strong> on myGov
                  (pre-filled by your employer via Single Touch Payroll).
                </div>
                <div class="annual-payg-grid">
                  <div class="form-group">
                    <label class="form-label">Gross salary / wages (Item 1)</label>
                    <div class="annual-input-wrap">
                      <span class="annual-input-prefix">$</span>
                      <input class="form-input annual-money-input" id="annual-payg-salary"
                        type="number" min="0" step="1" placeholder="0"
                        value="${u.paygSalary || ''}"
                        oninput="updateAnnualInput('paygSalary', this.value)" />
                    </div>
                    <div class="annual-field-hint">Before tax — from your income statement</div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tax withheld by employer (Item 1W)</label>
                    <div class="annual-input-wrap">
                      <span class="annual-input-prefix">$</span>
                      <input class="form-input annual-money-input" id="annual-payg-withheld"
                        type="number" min="0" step="1" placeholder="0"
                        value="${u.paygWithheld || ''}"
                        oninput="updateAnnualInput('paygWithheld', this.value)" />
                    </div>
                    <div class="annual-field-hint">This reduces your final tax bill as a credit</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Other adjustments ── -->
          <div class="card annual-card">
            <div class="card-header">
              <div class="card-title">⚙️ Other adjustments</div>
              <div class="card-sub">Home office, PAYG instalments, HECS, Medicare</div>
            </div>
            <div class="card-body">

              <!-- Home office hours -->
              <div class="annual-adj-row">
                <div>
                  <div class="annual-adj-label">Home office hours worked this FY</div>
                  <div class="annual-field-hint">ATO fixed rate: 67c per hour (2024-25). Leave blank if claiming actual expenses instead.</div>
                </div>
                <div class="annual-adj-input-wrap">
                  <input class="form-input annual-adj-input" id="annual-ho-hours"
                    type="number" min="0" step="1" placeholder="0"
                    value="${u.homeOfficeHours || ''}"
                    oninput="updateAnnualInput('homeOfficeHours', this.value)" />
                  <span class="annual-adj-unit">hrs × $0.67 = ${UI.currencyFull((u.homeOfficeHours || 0) * 0.67)}</span>
                </div>
              </div>

              <div class="annual-adj-divider"></div>

              <!-- PAYG instalments -->
              <div class="annual-adj-row">
                <div>
                  <div class="annual-adj-label">PAYG instalments paid to ATO (business)</div>
                  <div class="annual-field-hint">
                    The ATO auto-enrols sole traders earning over ~$4,000 in quarterly instalments.
                    Check your ATO online account or BAS history.
                  </div>
                </div>
                <div class="annual-adj-input-wrap">
                  <span class="annual-input-prefix">$</span>
                  <input class="form-input annual-money-input" id="annual-payg-inst"
                    type="number" min="0" step="1" placeholder="0"
                    value="${u.paygInstalments || ''}"
                    oninput="updateAnnualInput('paygInstalments', this.value)" />
                </div>
              </div>

              <div class="annual-adj-divider"></div>

              <!-- HECS -->
              <div class="annual-adj-row">
                <div>
                  <div class="annual-adj-label">HECS/HELP debt</div>
                  <div class="annual-field-hint">
                    Compulsory repayment applies above ~$54,435 combined income.
                    Check StudyAssist for your balance.
                  </div>
                </div>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex-shrink:0">
                  <input type="checkbox" id="annual-hecs"
                    ${u.hasHECS ? 'checked' : ''}
                    onchange="updateAnnualInput('hasHECS', this.checked)"
                    style="accent-color:var(--brand);width:16px;height:16px" />
                  <span style="font-size:var(--text-sm);color:var(--text2)">I have a HECS/HELP debt</span>
                </label>
              </div>

              <div class="annual-adj-divider"></div>

              <!-- Private health -->
              <div class="annual-adj-row">
                <div>
                  <div class="annual-adj-label">Private hospital cover</div>
                  <div class="annual-field-hint">
                    Without cover and income over $93,000, Medicare Levy Surcharge (1%) applies.
                  </div>
                </div>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex-shrink:0">
                  <input type="checkbox" id="annual-health"
                    ${u.hasPrivateHealth ? 'checked' : ''}
                    onchange="updateAnnualInput('hasPrivateHealth', this.checked)"
                    style="accent-color:var(--brand);width:16px;height:16px" />
                  <span style="font-size:var(--text-sm);color:var(--text2)">I have private hospital cover</span>
                </label>
              </div>

            </div>
          </div>

        </div>

        <!-- RIGHT — Tax breakdown + myTax guide + declaration -->
        <div class="annual-right">

          <!-- ── Tax breakdown card ── -->
          <div class="card annual-card">
            <div class="card-header">
              <div class="card-title">🧮 Tax calculation — FY ${ANNUAL_FY}</div>
              <div class="card-sub">2024-25 resident individual rates</div>
            </div>
            <div class="card-body annual-tax-body">

              <!-- Income summary -->
              <div class="annual-tax-section-label">COMBINED INCOME</div>
              <div class="annual-tax-row">
                <span>Net business income (ABN)</span>
                <span class="annual-tax-val">${UI.currencyFull(f.netBusinessIncome)}</span>
              </div>
              ${f.paygSalary > 0 ? `
                <div class="annual-tax-row">
                  <span>Salary / wages (PAYG)</span>
                  <span class="annual-tax-val">${UI.currencyFull(f.paygSalary)}</span>
                </div>
              ` : ''}
              ${f.additionalInterest > 0 || f.otherIncome > 0 ? `
                <div class="annual-tax-row">
                  <span>Other income</span>
                  <span class="annual-tax-val">${UI.currencyFull(f.additionalInterest + f.otherIncome)}</span>
                </div>
              ` : ''}
              <div class="annual-tax-row annual-tax-row--subtotal">
                <span>Total taxable income</span>
                <span>${UI.currencyFull(f.taxableIncome)}</span>
              </div>

              <div class="annual-tax-divider"></div>

              <!-- Tax components -->
              <div class="annual-tax-section-label">TAX COMPONENTS</div>
              <div class="annual-tax-row">
                <span>Income tax (bracket rate)</span>
                <span class="annual-tax-val annual-tax-val--debit">${UI.currencyFull(f.incomeTax)}</span>
              </div>
              <div class="annual-tax-row">
                <span>Medicare Levy (2%)</span>
                <span class="annual-tax-val annual-tax-val--debit">${UI.currencyFull(f.medicareLevy)}</span>
              </div>
              ${f.mls > 0 ? `
                <div class="annual-tax-row">
                  <span>Medicare Levy Surcharge (1%)</span>
                  <span class="annual-tax-val annual-tax-val--debit">${UI.currencyFull(f.mls)}</span>
                </div>
              ` : ''}
              ${f.hecsRepay > 0 ? `
                <div class="annual-tax-row">
                  <span>HECS/HELP repayment</span>
                  <span class="annual-tax-val annual-tax-val--debit">${UI.currencyFull(f.hecsRepay)}</span>
                </div>
              ` : ''}
              ${f.lito > 0 ? `
                <div class="annual-tax-row">
                  <span>Low Income Tax Offset (LITO)</span>
                  <span class="annual-tax-val annual-tax-val--credit">– ${UI.currencyFull(f.lito)}</span>
                </div>
              ` : ''}

              <div class="annual-tax-row annual-tax-row--subtotal">
                <span>Total tax liability</span>
                <span>${UI.currencyFull(f.totalTax)}</span>
              </div>

              <div class="annual-tax-divider"></div>

              <!-- Credits -->
              <div class="annual-tax-section-label">CREDITS APPLIED</div>
              ${f.paygWithheld > 0 ? `
                <div class="annual-tax-row">
                  <span>PAYG withheld by employer</span>
                  <span class="annual-tax-val annual-tax-val--credit">– ${UI.currencyFull(f.paygWithheld)}</span>
                </div>
              ` : ''}
              ${f.u.paygInstalments > 0 ? `
                <div class="annual-tax-row">
                  <span>PAYG instalments (business)</span>
                  <span class="annual-tax-val annual-tax-val--credit">– ${UI.currencyFull(f.u.paygInstalments)}</span>
                </div>
              ` : ''}

              <div class="annual-tax-divider"></div>

              <!-- Final result -->
              <div class="annual-tax-result ${f.amountOwing > 0 ? 'annual-tax-result--owing' : 'annual-tax-result--refund'}">
                <div class="annual-tax-result-label">
                  ${f.amountOwing > 0 ? '⚠️ Amount owing to ATO' : '✓ Estimated refund'}
                </div>
                <div class="annual-tax-result-amount">
                  ${f.amountOwing > 0
                    ? UI.currencyFull(f.amountOwing)
                    : UI.currencyFull(Math.abs(f.amountOwing))
                  }
                </div>
                <div class="annual-tax-result-note">
                  Estimate only — confirm with a tax agent or myTax pre-fill
                </div>
              </div>

            </div>
          </div>

          <!-- ── myTax field guide ── -->
          <div class="card annual-card">
            <div class="card-header">
              <div class="card-title">📋 Enter these in myTax</div>
              <div class="card-sub">my.gov.au → Tax → Lodge return → takes ~10 minutes</div>
            </div>
            <div class="card-body annual-mytax-body">

              <div class="annual-mytax-steps">
                <div class="annual-mytax-step">Step 1 — Log into myGov and open myTax</div>
                <div class="annual-mytax-step">Step 2 — Check pre-filled data from your employer and bank</div>
                <div class="annual-mytax-step">Step 3 — Enter the figures below where myTax shows them</div>
                <div class="annual-mytax-step">Step 4 — Review and submit</div>
              </div>

              <div class="annual-mytax-fields">
                ${f.paygSalary > 0 ? `
                  <div class="annual-mytax-field">
                    <div class="annual-mytax-field-label">Item 1 — Salary &amp; wages</div>
                    <div class="annual-mytax-field-val">${UI.currencyFull(f.paygSalary)}</div>
                  </div>
                  <div class="annual-mytax-field">
                    <div class="annual-mytax-field-label">Item 1W — Tax withheld</div>
                    <div class="annual-mytax-field-val">${UI.currencyFull(f.paygWithheld)}</div>
                  </div>
                ` : ''}
                <div class="annual-mytax-field">
                  <div class="annual-mytax-field-label">Item 15 — Net business income</div>
                  <div class="annual-mytax-field-val annual-mytax-field-val--primary">
                    ${UI.currencyFull(f.netBusinessIncome)}
                  </div>
                </div>
                ${f.deductions.map(function(d) { return `
                  <div class="annual-mytax-field">
                    <div class="annual-mytax-field-label">${d.label}</div>
                    <div class="annual-mytax-field-val">– ${UI.currencyFull(d.amount)}</div>
                  </div>
                `; }).join('')}
                ${f.additionalInterest > 0 ? `
                  <div class="annual-mytax-field">
                    <div class="annual-mytax-field-label">Item 10 — Interest income</div>
                    <div class="annual-mytax-field-val">${UI.currencyFull(f.additionalInterest)}</div>
                  </div>
                ` : ''}
              </div>

              <div class="annual-notice annual-notice--tip" style="margin-top:16px">
                💡 myTax may pre-fill some of these from employer STP data and bank interest
                reports. Cross-check with your figures above before submitting.
              </div>

            </div>
          </div>

          <!-- ── Declaration ── -->
          <div class="declaration-box annual-declaration">
            <div class="declaration-title">📄 Declaration — annual return</div>
            <div class="declaration-text">
              This tax return and all supporting documents are true and correct.
              I am the individual named below and authorised to make this declaration.
            </div>
            <div class="checkbox-row">
              <input type="checkbox" id="annual-dec-check"
                onchange="toggleAnnualDeclBtn()" />
              <label class="checkbox-label" for="annual-dec-check">
                I declare this annual return is true and correct for FY ${ANNUAL_FY}
              </label>
            </div>
            <div class="form-group" style="margin-top:12px">
              <label class="form-label">Full legal name (type to sign)</label>
              <input class="form-input" id="annual-sig-name"
                placeholder="e.g. Jane Louise Davidson"
                oninput="toggleAnnualDeclBtn()" />
              <div class="annual-field-hint" style="margin-top:4px">
                Signed on ${new Date().toLocaleDateString('en-AU', {day:'numeric',month:'long',year:'numeric'})}
              </div>
            </div>
            <button class="btn btn-primary annual-decl-btn"
              id="annual-decl-btn" disabled
              onclick="confirmAnnualDeclaration()"
              style="width:100%;justify-content:center;margin-top:14px">
              Confirm &amp; download full report PDF →
            </button>
            <div class="annual-notice annual-notice--tip" style="margin-top:12px">
              ⚠️ Taxlyy prepares your figures only. You must lodge the return yourself
              via myTax or through a registered tax agent.
            </div>
          </div>

        </div>
      </div>

      <!-- ── myTax guide modal ── -->
      <div id="annual-mytax-modal" onclick="if(event.target===this)closeMyTaxGuide()"
        style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);
          align-items:center;justify-content:center;padding:24px;overflow-y:auto">
        <div style="background:var(--surface);border-radius:var(--radius);max-width:520px;
          width:100%;margin:auto;padding:28px;box-shadow:0 20px 40px rgba(0,0,0,0.3)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <div style="font-size:var(--text-lg);font-weight:600;color:var(--text)">
              How to lodge via myTax
            </div>
            <button class="btn btn-ghost btn-sm" onclick="closeMyTaxGuide()">Close ✕</button>
          </div>
          <ol style="font-size:var(--text-sm);color:var(--text2);line-height:1.8;padding-left:20px">
            <li>Go to <strong style="color:var(--brand)">my.gov.au</strong> and sign in</li>
            <li>Link your ATO account if you haven't already</li>
            <li>Go to <strong>Tax → Lodgements → Income tax</strong></li>
            <li>Select FY 2024–25 and click Lodge</li>
            <li>Work through each section — most will be pre-filled from STP and bank data</li>
            <li>Enter your <strong>business income (Item 15)</strong> and deductions from this report</li>
            <li>Review the summary — ATO will show your estimated refund or amount owing</li>
            <li>Submit electronically — confirmation arrives within seconds</li>
          </ol>
          <div style="margin-top:20px;padding:12px;background:var(--gold-dim);border-radius:var(--radius-sm);
            font-size:var(--text-xs);color:var(--text2)">
            Due date for self-lodgement: <strong>${ANNUAL_DUE_DATE}</strong>.
            If using a tax agent, they have until 15 May 2026.
          </div>
        </div>
      </div>

    </div>
  `;
}

/* ─────────────────────────────────────────
   Interactions
───────────────────────────────────────── */
function updateAnnualInput(key, value) {
  if (!AppData.annualUserInputs) AppData.annualUserInputs = {};
  if (typeof value === 'string' && !isNaN(value) && value !== '') {
    AppData.annualUserInputs[key] = parseFloat(value);
  } else {
    AppData.annualUserInputs[key] = value;
  }
  refreshAnnualCalculations();
}

function toggleAnnualPayg(checked) {
  var section = document.getElementById('annual-payg-section');
  if (section) section.style.display = checked ? 'block' : 'none';
  if (!AppData.annualUserInputs) AppData.annualUserInputs = {};
  AppData.annualUserInputs.showPayg = checked;
  if (!checked) {
    AppData.annualUserInputs.paygSalary  = 0;
    AppData.annualUserInputs.paygWithheld = 0;
  }
  refreshAnnualCalculations();
}

function toggleAnnualDeclBtn() {
  var chk  = document.getElementById('annual-dec-check');
  var name = document.getElementById('annual-sig-name');
  var btn  = document.getElementById('annual-decl-btn');
  if (btn) {
    btn.disabled = !(chk && chk.checked && name && name.value.trim().length > 2);
  }
}

function refreshAnnualCalculations() {
  /* Recompute and update the stats + tax card without full rebuild */
  var f = getAnnualFigures();

  /* Update stat cards */
  var statVals = document.querySelectorAll('.stat-value');
  if (statVals.length >= 4) {
    statVals[0].textContent = UI.currencyFull(f.grossBusinessIncomeExGst);
    statVals[1].textContent = UI.currencyFull(f.totalDeductions);
    statVals[2].textContent = UI.currencyFull(f.netBusinessIncome);
    statVals[3].textContent = UI.currencyFull(f.totalTax);
  }

  /* Update home office calculation inline */
  var hoAdj = document.querySelector('.annual-adj-unit');
  if (hoAdj) {
    var hrs = parseFloat((AppData.annualUserInputs || {}).homeOfficeHours || 0);
    hoAdj.textContent = 'hrs \u00d7 $0.67 = ' + UI.currencyFull(hrs * 0.67);
  }

  /* Full right-column refresh for tax breakdown */
  var screen = document.getElementById('screen-annual');
  if (!screen) return;
  var rightCol = screen.querySelector('.annual-right');
  if (!rightCol) return;

  /* Re-render just the tax card and mytax card */
  var tmpDiv = document.createElement('div');
  tmpDiv.innerHTML = buildAnnual();
  var newRight = tmpDiv.querySelector('.annual-right');
  if (newRight) rightCol.innerHTML = newRight.innerHTML;
}

function confirmAnnualDeclaration() {
  var name = (document.getElementById('annual-sig-name') || {}).value || '';
  if (!name.trim()) return;
  var f = getAnnualFigures();

  /* Save to AppData */
  if (!AppData.annualReports) AppData.annualReports = [];
  AppData.annualReports.push({
    id:           'annual-' + Date.now(),
    fy:           ANNUAL_FY,
    signedAt:     new Date().toISOString(),
    signedBy:     name.trim(),
    netIncome:    f.netBusinessIncome,
    taxableIncome:f.taxableIncome,
    totalTax:     f.totalTax,
    amountOwing:  f.amountOwing,
  });

  showAnnualToast('✓ Declaration saved · Download your PDF to lodge via myTax');
  exportAnnualCSV();
}

function exportAnnualCSV() {
  var f = getAnnualFigures();
  var rows = [
    'Taxlyy Annual Tax Report — FY ' + ANNUAL_FY,
    'Generated,' + new Date().toLocaleDateString('en-AU'),
    '',
    'INCOME',
    'Gross ABN income (ex GST),' + f.grossBusinessIncomeExGst.toFixed(2),
    f.paygSalary > 0 ? 'Salary/wages (PAYG),' + f.paygSalary.toFixed(2) : '',
    f.additionalInterest > 0 ? 'Bank interest,' + f.additionalInterest.toFixed(2) : '',
    '',
    'DEDUCTIONS',
  ].concat(f.deductions.map(function(d) {
    return d.label + ',' + d.amount.toFixed(2);
  })).concat([
    '',
    'SUMMARY',
    'Net business income (Item 15),' + f.netBusinessIncome.toFixed(2),
    'Total taxable income,' + f.taxableIncome.toFixed(2),
    'Income tax,' + f.incomeTax.toFixed(2),
    'Medicare Levy,' + f.medicareLevy.toFixed(2),
    f.mls > 0 ? 'Medicare Levy Surcharge,' + f.mls.toFixed(2) : '',
    f.hecsRepay > 0 ? 'HECS/HELP repayment,' + f.hecsRepay.toFixed(2) : '',
    'LITO offset,-' + f.lito.toFixed(2),
    'Total tax liability,' + f.totalTax.toFixed(2),
    f.paygWithheld > 0 ? 'PAYG withheld (credit),-' + f.paygWithheld.toFixed(2) : '',
    f.u.paygInstalments > 0 ? 'PAYG instalments (credit),-' + (f.u.paygInstalments||0).toFixed(2) : '',
    (f.amountOwing > 0 ? 'Amount owing,' : 'Estimated refund,') + Math.abs(f.amountOwing).toFixed(2),
  ]).filter(function(r){ return r !== ''; });

  var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href     = url;
  a.download = 'taxlyy_annual_FY2024-25.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function printAnnualReport() {
  var f = getAnnualFigures();
  var win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to download the PDF.'); return; }
  win.document.write('<html><head><title>Annual Report FY ' + ANNUAL_FY + '</title>'
    + '<style>body{font-family:sans-serif;padding:40px;max-width:720px;margin:auto}'
    + 'h1{font-size:20px}h2{font-size:14px;margin-top:24px;border-bottom:1px solid #ccc;padding-bottom:6px}'
    + '.row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}'
    + '.total{font-weight:700;border-top:2px solid #333;margin-top:8px;padding-top:8px}'
    + '</style></head><body>'
    + '<h1>Taxlyy — Annual Tax Report FY ' + ANNUAL_FY + '</h1>'
    + '<p style="color:#666;font-size:12px">Generated ' + new Date().toLocaleDateString('en-AU') + ' · Estimate only</p>'
    + '<h2>Income</h2>'
    + '<div class="row"><span>Gross ABN income (ex GST)</span><span>$' + f.grossBusinessIncomeExGst.toFixed(2) + '</span></div>'
    + (f.paygSalary > 0 ? '<div class="row"><span>Salary/wages</span><span>$' + f.paygSalary.toFixed(2) + '</span></div>' : '')
    + '<h2>Deductions</h2>'
    + f.deductions.map(function(d){ return '<div class="row"><span>' + d.label + '</span><span>–$' + d.amount.toFixed(2) + '</span></div>'; }).join('')
    + '<h2>Summary</h2>'
    + '<div class="row"><span>Net business income (Item 15)</span><span>$' + f.netBusinessIncome.toFixed(2) + '</span></div>'
    + '<div class="row"><span>Total taxable income</span><span>$' + f.taxableIncome.toFixed(2) + '</span></div>'
    + '<div class="row"><span>Income tax</span><span>$' + f.incomeTax.toFixed(2) + '</span></div>'
    + '<div class="row"><span>Medicare Levy</span><span>$' + f.medicareLevy.toFixed(2) + '</span></div>'
    + '<div class="row"><span>LITO offset</span><span>–$' + f.lito.toFixed(2) + '</span></div>'
    + '<div class="row total"><span>' + (f.amountOwing > 0 ? 'Amount owing' : 'Estimated refund') + '</span><span>$' + Math.abs(f.amountOwing).toFixed(2) + '</span></div>'
    + '<p style="margin-top:40px;font-size:11px;color:#999">This report is prepared by Taxlyy for reference only. Lodge via myTax at my.gov.au or through a registered tax agent.</p>'
    + '</body></html>');
  win.document.close();
  setTimeout(function(){ win.print(); }, 500);
}

function openMyTaxGuide() {
  var modal = document.getElementById('annual-mytax-modal');
  if (modal) modal.style.display = 'flex';
}

function closeMyTaxGuide() {
  var modal = document.getElementById('annual-mytax-modal');
  if (modal) modal.style.display = 'none';
}

function showAnnualToast(msg) {
  var existing = document.querySelector('.annual-toast');
  if (existing) existing.remove();
  var t = document.createElement('div');
  t.className = 'annual-toast upload-success-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 4000);
}