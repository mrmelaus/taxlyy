

/* ─────────────────────────────────────────
   screens/annual.js
───────────────────────────────────────── */
function buildAnnual() {
  const a = AppData.annual;
  return `
    <div class="screen" id="screen-annual">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
          <div style="font-size:18px;font-weight:600;color:var(--text)">Annual tax report — FY ${a.fy}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px">
            1 Jul 2024 – 30 Jun 2025 · Self-lodgement due ${a.dueDate}
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost">Share with accountant</button>
          <button class="btn btn-ghost">Download PDF</button>
          <button class="btn btn-primary">Generate report →</button>
        </div>
      </div>

      <div class="stats-grid">
        ${UI.statCard({ label:'Gross income',    value: UI.currencyFull(a.grossIncome),      change:'All paid invoices',  changeType:'up',   variant:'positive' })}
        ${UI.statCard({ label:'Total deductions',value: UI.currencyFull(a.totalDeductions),  change:'All confirmed'                                              })}
        ${UI.statCard({ label:'Taxable income',  value: UI.currencyFull(a.taxableIncome),    change:'Net profit',         variant:'positive'                     })}
        ${UI.statCard({ label:'Est. tax payable',value: UI.currencyFull(a.estTaxPayable),    change:'Estimate only',      changeType:'warn', variant:'warning'   })}
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><div class="card-title">Profit &amp; loss summary</div></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:10px">
              <div class="total-row" style="padding-bottom:10px;border-bottom:1px solid var(--border)">
                <span style="font-size:13px;font-weight:500;color:var(--text)">Business income</span>
                <span style="font-family:var(--mono);color:var(--green);font-size:15px;font-weight:500">${UI.currencyFull(a.grossIncome)}</span>
              </div>
              <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-top:4px">Deductions</div>
              ${a.deductions.map(d => `
                <div class="total-row">
                  <span class="total-label">${d.label}</span>
                  <span class="total-val" style="color:var(--coral)">– ${UI.currencyFull(d.amount)}</span>
                </div>
              `).join('')}
              <div class="total-row grand">
                <span>Net profit (taxable income)</span>
                <span style="color:var(--aqua)">${UI.currencyFull(a.taxableIncome)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="card">
            <div class="card-header"><div class="card-title">Enter in myTax via myGov</div></div>
            <div class="card-body" style="padding:14px 16px">
              <div style="font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:12px">
                Your app prepares all figures. You enter them into myTax at
                <span style="color:var(--teal-light)">my.gov.au</span> — takes about 10 minutes.
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                <div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 10px;background:var(--surface2);border-radius:6px">
                  <span style="color:var(--text3)">Label: Business income</span>
                  <span style="font-family:var(--mono);color:var(--text)">${UI.currencyFull(a.grossIncome)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 10px;background:var(--surface2);border-radius:6px">
                  <span style="color:var(--text3)">Label: Total deductions</span>
                  <span style="font-family:var(--mono);color:var(--text)">${UI.currencyFull(a.totalDeductions)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 10px;background:var(--surface2);border-radius:6px">
                  <span style="color:var(--text3)">Label: Net income</span>
                  <span style="font-family:var(--mono);color:var(--aqua)">${UI.currencyFull(a.taxableIncome)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="declaration-box">
            <div class="declaration-title">Declaration — annual return</div>
            <div class="declaration-text">This tax return and attached documents are correct and complete. I am authorised to make this declaration.</div>
            <div class="checkbox-row">
              <input type="checkbox" id="annual-dec-check" />
              <label class="checkbox-label" for="annual-dec-check">
                I declare this annual return is true and correct for FY ${a.fy}
              </label>
            </div>
            <div class="form-group" style="margin-top:10px">
              <label class="form-label">Full legal name</label>
              <input class="form-input" placeholder="e.g. Jane Louise Davidson" />
            </div>
            <button class="btn btn-primary" style="margin-top:12px;width:100%;justify-content:center">
              Confirm &amp; download full report PDF →
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
