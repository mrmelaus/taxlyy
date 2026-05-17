/* ─────────────────────────────────────────
   screens/depreciation.js
   Div 40 depreciation — ATO-compliant
   Prime Cost (s40-70) & Diminishing Value (s40-75)
   ATO effective lives: TR 2023/1
   Low-value threshold: $300 (immediate deduction)
   ─────────────────────────────────────────
   CALCULATION RULES:
   ─ Prime Cost  : Cost × (Days held / 365) × (100% / Effective life years)
   ─ Dim. Value  : Opening WDV × (Days held / 365) × (200% / Effective life years)
   ─ Year 1      : Only pro-rate from purchase date to 30 Jun
   ─ Business %  : Applied after depreciation calculation
   ─ GST base    : Use cost EXCLUDING GST as the depreciable base
   ─ Under $300  : Not eligible — should be immediate deduction in expenses
───────────────────────────────────────── */

/* ── ATO Effective Lives (TR 2023/1) ── */
var ATO_ASSET_TYPES = [
  { value: 'computer',       label: 'Computer / Laptop',          life: 3    },
  { value: 'tablet',         label: 'Tablet (iPad etc.)',          life: 3    },
  { value: 'phone',          label: 'Smartphone',                  life: 3    },
  { value: 'printer',        label: 'Printer / Scanner',           life: 5    },
  { value: 'monitor',        label: 'Monitor / Display',           life: 3    },
  { value: 'camera',         label: 'Camera (DSLR / Mirrorless)',  life: 5    },
  { value: 'av_equipment',   label: 'AV / Studio Equipment',       life: 5    },
  { value: 'furniture_desk', label: 'Desk / Office Furniture',     life: 13.3 },
  { value: 'chair',          label: 'Office Chair',                life: 10   },
  { value: 'carpet',         label: 'Carpet / Floor Coverings',    life: 10   },
  { value: 'aircon',         label: 'Air Conditioner',             life: 10   },
  { value: 'vehicle_car',    label: 'Car (passenger)',             life: 8    },
  { value: 'vehicle_ute',    label: 'Ute / Van / Truck',           life: 8    },
  { value: 'power_tools',    label: 'Power Tools',                 life: 5    },
  { value: 'hand_tools',     label: 'Hand Tools / Equipment',      life: 3    },
  { value: 'machinery',      label: 'Machinery (general)',         life: 10   },
  { value: 'solar',          label: 'Solar Panels',                life: 20   },
  { value: 'other',          label: 'Other (custom life)',         life: 5    },
];

var CURRENT_FY_START = new Date('2024-07-01');
var CURRENT_FY_END   = new Date('2025-06-30');
var CURRENT_FY_LABEL = '2024\u201325';

/* ─────────────────────────────────────────
   Core: calculate depreciation for one asset
   for the CURRENT financial year
───────────────────────────────────────── */
function calcDepreciation(asset) {
  var purchaseDate  = asset.purchaseDate;
  var costExGst     = asset.costExGst;
  var method        = asset.method;
  var effectiveLife = asset.effectiveLife;
  var businessUsePct = asset.businessUsePct !== undefined ? asset.businessUsePct : 100;

  if (!costExGst || costExGst <= 0 || !effectiveLife || effectiveLife <= 0) {
    return { openingValue: 0, depreciation: 0, closingValue: 0 };
  }

  var purchaseDateObj = new Date(purchaseDate + 'T00:00:00');
  var fyStart = new Date(CURRENT_FY_START);
  var fyEnd   = new Date(CURRENT_FY_END);
  var busPct  = businessUsePct / 100;

  var wdv = costExGst;

  if (purchaseDateObj < fyStart) {
    var purchYear = purchaseDateObj.getFullYear();
    var purchMonth = purchaseDateObj.getMonth();
    var firstFyEndYear = purchMonth >= 6 ? purchYear + 1 : purchYear;
    var firstFyEnd = new Date(firstFyEndYear, 5, 30);
    var daysInFirstYear = Math.max((firstFyEnd - purchaseDateObj) / 86400000 + 1, 1);

    if (method === 'pc') {
      wdv -= costExGst * (daysInFirstYear / 365) * (1 / effectiveLife);
    } else {
      wdv -= wdv * (daysInFirstYear / 365) * (2 / effectiveLife);
    }
    wdv = Math.max(wdv, 0);

    var yearStart = new Date(firstFyEndYear, 6, 1);
    while (yearStart < fyStart && wdv > 0) {
      if (method === 'pc') {
        wdv -= costExGst * (1 / effectiveLife);
      } else {
        wdv -= wdv * (2 / effectiveLife);
      }
      wdv = Math.max(wdv, 0);
      yearStart.setFullYear(yearStart.getFullYear() + 1);
    }
  }

  var openingValue = Math.max(wdv, 0);
  var holdStart = purchaseDateObj > fyStart ? purchaseDateObj : fyStart;
  var daysHeld  = Math.max((fyEnd - holdStart) / 86400000 + 1, 0);

  var depnFull = 0;
  if (method === 'pc') {
    depnFull = costExGst * (daysHeld / 365) * (1 / effectiveLife);
  } else {
    var dvBase = purchaseDateObj >= fyStart ? costExGst : openingValue;
    depnFull = dvBase * (daysHeld / 365) * (2 / effectiveLife);
  }

  depnFull = Math.min(depnFull, openingValue);
  depnFull = Math.max(depnFull, 0);

  var depn = round2(depnFull * busPct);
  var closingValue = Math.max(round2(openingValue - depnFull), 0);

  return {
    openingValue: round2(openingValue),
    depreciation: depn,
    closingValue: closingValue,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/* ── Date formatting helpers for dd/mm/yyyy ── */
function formatDateDMY(isoDate) {
  if (!isoDate) return '';
  var d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  var day = String(d.getDate()).padStart(2, '0');
  var mon = String(d.getMonth() + 1).padStart(2, '0');
  var yr = d.getFullYear();
  return day + '/' + mon + '/' + yr;
}

function parseDMYtoISO(dmyString) {
  if (!dmyString) return '';
  
  // Remove any non-digit characters and reconstruct
  var digits = dmyString.replace(/\D/g, '');
  
  // Handle 8-digit input (01012000)
  if (digits.length === 8) {
    var day = digits.substring(0, 2);
    var mon = digits.substring(2, 4);
    var yr = digits.substring(4, 8);
    dmyString = day + '/' + mon + '/' + yr;
  }
  
  // Handle 6-digit input (010100 -> 01/01/2000)
  if (digits.length === 6) {
    var day6 = digits.substring(0, 2);
    var mon6 = digits.substring(2, 4);
    var yr6 = digits.substring(4, 6);
    dmyString = day6 + '/' + mon6 + '/20' + yr6;
  }
  
  var parts = dmyString.split('/');
  if (parts.length !== 3) return '';
  
  var day = parseInt(parts[0], 10);
  var mon = parseInt(parts[1], 10);
  var yr = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(mon) || isNaN(yr)) return '';
  if (yr < 100) return ''; // Year must be 4 digits
  
  return yr + '-' + String(mon).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}
function validateDateFormat(input) {
  var val = input.value;
  var regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  
  if (regex.test(val)) {
    var day = parseInt(RegExp.$1, 10);
    var mon = parseInt(RegExp.$2, 10);
    var yr = parseInt(RegExp.$3, 10);
    
    // Check if it's a real date
    var date = new Date(yr, mon - 1, day);
    var isValid = (date.getFullYear() === yr && date.getMonth() === mon - 1 && date.getDate() === day);
    
    if (isValid) {
      input.style.borderColor = 'var(--green)';
      input.setCustomValidity('');
      return true;
    }
  }
  
  // If empty, don't show error (user might be typing)
  if (!val) {
    input.style.borderColor = 'var(--border)';
    input.setCustomValidity('');
    return false;
  }
  
  // Invalid format
  input.style.borderColor = 'var(--coral)';
  input.setCustomValidity('Please use dd/mm/yyyy format (e.g. 15/03/2024)');
  return false;
}
function autoFormatDate(input) {
  var raw = input.value.replace(/\D/g, ''); // Remove all non-digits
  
  if (raw.length === 0) {
    return;
  }
  
  // Handle 8-digit input: 01012000 -> 01/01/2000
  if (raw.length === 8) {
    var day = raw.substring(0, 2);
    var mon = raw.substring(2, 4);
    var yr = raw.substring(4, 8);
    
    // Validate day (01-31), month (01-12), year (1900-2099)
    var dayNum = parseInt(day, 10);
    var monNum = parseInt(mon, 10);
    var yrNum = parseInt(yr, 10);
    
    if (dayNum >= 1 && dayNum <= 31 && monNum >= 1 && monNum <= 12 && yrNum >= 1900 && yrNum <= 2099) {
      input.value = day + '/' + mon + '/' + yr;
      input.style.borderColor = 'var(--green)';
      return;
    }
  }
  
  // Handle 6-digit input: 010100 -> 01/01/2000 (assume 2000s)
  if (raw.length === 6) {
    var day6 = raw.substring(0, 2);
    var mon6 = raw.substring(2, 4);
    var yr6 = raw.substring(4, 6);
    var fullYr = '20' + yr6;
    
    var dayNum6 = parseInt(day6, 10);
    var monNum6 = parseInt(mon6, 10);
    var yrNum6 = parseInt(fullYr, 10);
    
    if (dayNum6 >= 1 && dayNum6 <= 31 && monNum6 >= 1 && monNum6 <= 12 && yrNum6 >= 2000 && yrNum6 <= 2099) {
      input.value = day6 + '/' + mon6 + '/' + fullYr;
      input.style.borderColor = 'var(--green)';
      return;
    }
  }
  
  // Auto-add slashes as user types (2 digits -> slash, 4 digits -> slash)
  var withSlashes = '';
  for (var i = 0; i < raw.length && i < 8; i++) {
    if (i === 2 || i === 4) {
      withSlashes += '/';
    }
    withSlashes += raw[i];
  }
  
  if (withSlashes !== raw) {
    input.value = withSlashes;
  }
  
  // Validate as they type (green/red border)
  validateDateFormat(input);
}

function getAssetTypeLabel(value) {
  var t = ATO_ASSET_TYPES.find(function(t){ return t.value === value; });
  return t ? t.label : (value || 'Other');
}

function getDefaultLife(value) {
  var t = ATO_ASSET_TYPES.find(function(t){ return t.value === value; });
  return t ? t.life : 5;
}

/* ─────────────────────────────────────────
   Build screen — uses CSS classes, no inline styles
───────────────────────────────────────── */
function buildDepreciation() {
  var assets = AppData.assets || [];
  var liveAssets = assets.map(function(a) {
    var calc = calcDepreciation(a);
    return Object.assign({}, a, calc);
  });

  var totalOpen  = liveAssets.reduce(function(s,a){ return s + (a.openingValue || 0); }, 0);
  var totalDepn  = liveAssets.reduce(function(s,a){ return s + (a.depreciation || 0); }, 0);
  var totalClose = liveAssets.reduce(function(s,a){ return s + (a.closingValue  || 0); }, 0);
  var pendingAssets = (AppData.depreciableAssets || []).filter(function(a){ return a.status === 'pending'; });

  return `
    <div class="screen depn-screen" id="screen-depreciation">

      <div class="depn-header">
        <div class="depn-title-section">
          <div class="depn-title">Depreciation schedule</div>
          <div class="depn-subtitle">Div 40 — plant &amp; equipment · FY ${CURRENT_FY_LABEL} · ATO TR 2023/1 effective lives</div>
        </div>
        <div class="depn-actions">
          ${liveAssets.length > 0 ? `<button class="btn btn-ghost" onclick="exportDepreciationCSV()">📎 Export CSV</button>` : ''}
          <button class="btn btn-primary" onclick="openAddAssetModal()">+ Add asset</button>
        </div>
      </div>

      <div class="depn-info-banner">
        <strong>ATO rules (Div 40):</strong>
        Assets <strong>under $300</strong> → immediate deduction in Expenses (not here) ·
        Depreciable base = <strong>cost excluding GST</strong> ·
        Method (PC or DV) <strong>cannot be changed</strong> after first claim ·
        Business use % applied each year · Based on ATO TR 2023/1
      </div>

      ${pendingAssets.length > 0 ? `
        <div class="depn-pending-panel">
          <div class="depn-pending-title">⚡ ${pendingAssets.length} asset${pendingAssets.length > 1 ? 's' : ''} detected from your expenses — add to register?</div>
          ${pendingAssets.map(function(pa){ return `
            <div class="depn-pending-item">
              <div>
                <span class="depn-pending-item-info">${pa.description}</span>
                <span class="depn-pending-item-meta">${pa.purchaseDate} · ${UI.currencyFull(pa.purchaseAmount)}</span>
              </div>
              <div class="depn-pending-actions">
                <button class="btn btn-ghost btn-sm" onclick="dismissPendingAsset('${pa.id}')">Dismiss</button>
                <button class="btn btn-primary btn-sm" onclick="promotePendingAsset('${pa.id}')">Add to register →</button>
              </div>
            </div>
          `; }).join('')}
        </div>
      ` : ''}

      <div class="depn-stats-grid">
        ${UI.statCard({ label:'Opening WDV (1 Jul 2024)',   value: UI.currencyFull(totalOpen),  change: assets.length + ' asset' + (assets.length !== 1 ? 's' : '') + ' on register' })}
        ${UI.statCard({ label:'Depreciation deduction FY',  value: UI.currencyFull(totalDepn),  change:'Claimable in annual return', changeType:'down', variant:'alert' })}
        ${UI.statCard({ label:'Closing WDV (30 Jun 2025)',  value: UI.currencyFull(totalClose), change:'Carried to next FY' })}
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Asset register</div>
          <div class="depn-table-header-note">Click any row to edit</div>
        </div>

        ${liveAssets.length === 0 ? `
          <div class="depn-empty-state">
            <div class="depn-empty-icon">📋</div>
            <div class="depn-empty-title">No assets on register yet</div>
            <div class="depn-empty-sub">Add depreciable assets (computers, vehicles, equipment costing over $300)</div>
            <button class="btn btn-primary" onclick="openAddAssetModal()">+ Add your first asset</button>
          </div>
        ` : `
          <div class="depn-table-header">
            <div>Asset</div>
            <div style="text-align:center">Method</div>
            <div style="text-align:right">Biz %</div>
            <div style="text-align:right">Opening WDV</div>
            <div style="text-align:right">FY Deduction</div>
            <div style="text-align:right">Closing WDV</div>
            <div></div>
          </div>

          <div id="depn-asset-rows">
            ${liveAssets.map(function(a, i){ return renderAssetRow(a, i, liveAssets.length); }).join('')}
          </div>

          <div class="depn-table-footer">
            <div style="color:var(--text)">Totals</div>
            <div></div><div></div>
            <div style="text-align:right;color:var(--text)">${UI.currencyFull(totalOpen)}</div>
            <div style="text-align:right;color:var(--coral)">– ${UI.currencyFull(totalDepn)}</div>
            <div style="text-align:right;color:var(--text)">${UI.currencyFull(totalClose)}</div>
            <div></div>
          </div>
        `}
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-header"><div class="card-title">📐 How your depreciation is calculated</div></div>
        <div class="card-body depn-method-card">
          <div>
            <div class="depn-method-title">Prime Cost — s40-70 ITAA 1997</div>
            <div class="depn-method-desc">
              Equal deductions every year until fully depreciated.<br>
              <code class="depn-method-code">Cost (excl. GST) × (Days / 365) × (100% ÷ Life)</code><br>
              Best for: furniture, solar panels, machinery.
            </div>
          </div>
          <div>
            <div class="depn-method-title">Diminishing Value — s40-75 ITAA 1997</div>
            <div class="depn-method-desc">
              Larger deductions in early years, tapering off.<br>
              <code class="depn-method-code">Opening WDV × (Days / 365) × (200% ÷ Life)</code><br>
              Best for: laptops, phones, cameras (tech).
            </div>
          </div>
        </div>
        <div class="depn-footer-note">
          ⚠️ Once a method is used in your first claim, it <strong>cannot be changed</strong> for that asset. 
          All amounts are pro-rated in the year of purchase (days held ÷ 365). 
          Estimates only — confirm with a registered tax agent.
        </div>
      </div>

      <div id="asset-modal-overlay" class="depn-modal-overlay" onclick="if(event.target===this)closeAssetModal()">
        <div id="asset-modal" class="depn-modal"></div>
      </div>

    </div>
  `;
}

function renderAssetRow(a, i, total) {
  var calc       = calcDepreciation(a);
  var isLast     = i === total - 1;
  var methodLbl  = a.method === 'pc' ? 'Prime Cost' : 'Dim. Value';
  var typeLabel  = getAssetTypeLabel(a.assetType);
  var busPctClass = a.businessUsePct < 100 ? 'partial' : 'full';

  return `
    <div class="depn-table-row" style="border-bottom:${isLast ? 'none' : '1px solid var(--border)'}"
      onclick="openEditAssetModal('${a.id}')">
      <div>
        <div class="depn-asset-name">${a.name}</div>
        <div class="depn-asset-meta">${typeLabel} · ${formatDateShort(a.purchaseDate)} · ${a.effectiveLife} yr life · cost ex-GST ${UI.currencyFull(a.costExGst)}</div>
      </div>
      <div class="depn-method-badge">
        <span>${methodLbl}</span>
      </div>
      <div class="depn-business-pct ${busPctClass}">${a.businessUsePct}%</div>
      <div class="depn-opening-value">${UI.currencyFull(calc.openingValue)}</div>
      <div class="depn-deduction">– ${UI.currencyFull(calc.depreciation)}</div>
      <div class="depn-closing-value">${UI.currencyFull(calc.closingValue)}</div>
      <div class="depn-delete-cell" onclick="event.stopPropagation()">
        <button class="btn btn-ghost btn-sm" style="color:var(--coral);padding:3px 7px"
          onclick="deleteAsset('${a.id}')">✕</button>
      </div>
    </div>
  `;
}

function formatDateShort(iso) {
  if (!iso) return '—';
  var d   = new Date(iso + 'T00:00:00');
  var mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getDate() + ' ' + mon[d.getMonth()] + ' ' + d.getFullYear();
}

/* ─────────────────────────────────────────
   Add / Edit Modal
───────────────────────────────────────── */
function openAddAssetModal(prefill) {
  renderAssetModal(null, prefill || {});
}

function openEditAssetModal(id) {
  var asset = (AppData.assets || []).find(function(a){ return a.id === id; });
  if (asset) renderAssetModal(id, asset);
}

function renderAssetModal(editId, data) {
  var overlay = document.getElementById('asset-modal-overlay');
  var modal   = document.getElementById('asset-modal');
  if (!overlay || !modal) return;

  var d      = data || {};
  var isEdit = !!editId;

  var typeOpts = '<option value="" disabled' + (!d.assetType ? ' selected' : '') + '>— Please select asset type —</option>';
  typeOpts += ATO_ASSET_TYPES.map(function(t){
    return '<option value="' + t.value + '"' + (d.assetType === t.value ? ' selected' : '') + '>'
      + t.label + ' \u2014 ' + t.life + ' yr' + (t.life !== 1 ? 's' : '') + '</option>';
  }).join('');

  modal.innerHTML = `
    <div class="depn-modal-header">
      <div class="depn-modal-title">${isEdit ? 'Edit asset' : 'Add depreciable asset'}</div>
      <button class="btn btn-ghost btn-sm" onclick="closeAssetModal()">Close ✕</button>
    </div>
    
    <div class="depn-modal-body">

      <div class="form-group">
        <label class="form-label">Asset name *</label>
        <input class="form-input" id="am-name" placeholder="e.g. MacBook Pro 14-inch (2024)" value="${escD(d.name || '')}" />
      </div>

      <div class="depn-two-column">
        <div class="form-group">
          <label class="form-label">Asset type *</label>
          <select class="form-input" id="am-type" onchange="onAssetTypeChange()">${typeOpts}</select>
          <div id="am-type-hint" class="depn-hint-text" style="margin-top: 4px;">
            Select an asset type — effective life will auto-fill
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Effective life (years) *</label>
          <input class="form-input" id="am-life" type="number" min="0.5" max="50" step="0.5" 
            placeholder="Auto-filled from asset type"
            value="${d.effectiveLife || ''}" 
            oninput="checkEffectiveLifeOverride(this)" />
          <div class="depn-hint-text">
            ATO TR 2023/1: Computer 3y · Furniture 13.3y · Vehicle 8y · Other 5y
          </div>
          <div id="life-warning" style="display:none; margin-top:6px; padding:6px 10px; background:var(--coral-dim); border-left:3px solid var(--coral); border-radius:4px; font-size:var(--text-xs); color:var(--coral);">
            ⚠️ <strong>Tax impact:</strong> A longer effective life reduces your annual deduction. The ATO standard for this asset type is <span id="standard-life">—</span> years. Using <span id="entered-life">—</span> years will lower your tax benefit each year unless you can justify the longer life.
          </div>
        </div>
      </div>  <!-- Close depn-two-column -->

      <div class="depn-two-column">
        <div class="form-group">
          <label class="form-label">Purchase date *</label>
          <input class="form-input" id="am-date" type="text" placeholder="dd/mm/yyyy" 
              value="${formatDateDMY(d.purchaseDate) || ''}" 
              oninput="autoFormatDate(this)"
              onblur="validateDateFormat(this)" />
          <div class="depn-hint-text">Format: dd/mm/yyyy (e.g. 15/03/2025)</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Purchase cost (inc GST) *</label>
          <input class="form-input" id="am-cost-inc" type="number" min="300" step="0.01" placeholder="0.00" value="${d.purchaseCost || ''}" oninput="onCostIncChange()" />
        </div>
      </div>  <!-- Close depn-two-column -->

      <div class="depn-two-column">
        <div class="form-group">
          <label class="form-label">Cost excl. GST (depreciable base) *</label>
          <input class="form-input" id="am-cost-ex" type="number" min="300" step="0.01" placeholder="0.00" value="${d.costExGst || ''}" oninput="updateModalPreview()" />
          <div class="depn-hint-text">Auto-calc ÷1.1 — edit if supplier charged no GST</div>
        </div>
        <div class="form-group">
          <label class="form-label">Business use %</label>
          <input class="form-input" id="am-buspct" type="number" min="1" max="100" step="1" value="${d.businessUsePct !== undefined ? d.businessUsePct : 100}" oninput="updateModalPreview()" />
          <div class="depn-hint-text">e.g. 70 = used 70% for work</div>
        </div>
      </div>  <!-- Close depn-two-column -->

      <div class="form-group">
        <label class="form-label">Depreciation method *</label>
        <div class="depn-radio-group">
          <label id="lbl-dv" class="depn-method-option">
            <input type="radio" name="am-method" value="dv" id="am-dv" ${(!d.method || d.method === 'dv') ? 'checked' : ''} onchange="highlightMethod();updateModalPreview()" />
            <div>
              <div class="depn-method-option-title">Diminishing Value</div>
              <div class="depn-method-option-desc">Higher early deductions · good for tech</div>
            </div>
          </label>
          <label id="lbl-pc" class="depn-method-option">
            <input type="radio" name="am-method" value="pc" id="am-pc" ${d.method === 'pc' ? 'checked' : ''} onchange="highlightMethod();updateModalPreview()" />
            <div>
              <div class="depn-method-option-title">Prime Cost</div>
              <div class="depn-method-option-desc">Equal deductions every year</div>
            </div>
          </label>
        </div>
        <div class="depn-hint-text">⚠️ Cannot be changed after your first claim (ATO rules).</div>
      </div>

      <div class="depn-preview">
        <div class="depn-preview-label">Estimated FY ${CURRENT_FY_LABEL} deduction</div>
        <div id="am-preview-content" class="depn-preview-content">Fill in all fields above to see your estimate</div>
      </div>

    </div>  <!-- Close depn-modal-body -->

    <div class="depn-modal-footer">
      <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="saveAsset('${editId || ''}')">${isEdit ? 'Save changes' : 'Add to register'}</button>
      ${isEdit ? `<button class="btn btn-danger" onclick="deleteAsset('${editId}')">Delete</button>` : ''}
      <button class="btn btn-ghost" onclick="closeAssetModal()">Cancel</button>
    </div>
  `;

  overlay.style.display = 'flex';

  setTimeout(function(){
    highlightMethod();
    updateModalPreview();
    lastAutoFilledLife = null;
    onAssetTypeChange();
    ['am-date','am-life','am-cost-ex','am-buspct'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateModalPreview);
    });
  }, 50);
}

// Store the last auto-filled value to compare against
var lastAutoFilledLife = null;

function onAssetTypeChange() {
  var typeEl = document.getElementById('am-type');
  var lifeEl = document.getElementById('am-life');
  var warningDiv = document.getElementById('life-warning');
  
  if (!typeEl || !lifeEl) return;
  
  var selectedType = typeEl.value;
  
  // If no type selected (placeholder), clear the life field
  if (!selectedType) {
    lifeEl.value = '';
    lastAutoFilledLife = null;
    if (warningDiv) warningDiv.style.display = 'none';
    updateModalPreview();
    return;
  }
  
  var defaultLife = getDefaultLife(selectedType);
  var typeLabel = getAssetTypeLabel(selectedType);
  
  // Store the auto-filled value
  lastAutoFilledLife = defaultLife;
  
  // Auto-update the life field
  lifeEl.value = defaultLife;
  
  // Hide warning since it's the standard value
  if (warningDiv) warningDiv.style.display = 'none';
  if (lifeEl) lifeEl.removeAttribute('data-warned');
  
  // Show hint to user
  var typeHintEl = document.getElementById('am-type-hint');
  if (typeHintEl) {
    typeHintEl.innerHTML = `✓ Auto-filled: ${typeLabel} = ${defaultLife} year${defaultLife !== 1 ? 's' : ''} (ATO TR 2023/1)`;
    typeHintEl.style.color = 'var(--green)';
    setTimeout(function() {
      if (typeHintEl) typeHintEl.style.color = 'var(--text3)';
    }, 3000);
  }
  
  updateModalPreview();
}

function checkEffectiveLifeOverride(inputEl) {
  var warningDiv = document.getElementById('life-warning');
  var standardLifeSpan = document.getElementById('standard-life');
  var enteredLifeSpan = document.getElementById('entered-life');
  
  if (!warningDiv || !lastAutoFilledLife) return;
  
  var enteredValue = parseFloat(inputEl.value);
  var standardLife = lastAutoFilledLife;
  
  // Only show warning if user entered a longer life than standard
  if (enteredValue && !isNaN(enteredValue) && enteredValue > standardLife) {
    if (standardLifeSpan) standardLifeSpan.textContent = standardLife;
    if (enteredLifeSpan) enteredLifeSpan.textContent = enteredValue;
    warningDiv.style.display = 'block';
    
    // Optional: Add a one-time confirmation
    if (!inputEl.hasAttribute('data-warned')) {
      inputEl.setAttribute('data-warned', 'true');
      setTimeout(function() {
        alert(
          '⚠️ Tax Alert:\n\n' +
          'You entered ' + enteredValue + ' years, but the ATO standard for this asset type is ' + standardLife + ' years.\n\n' +
          'Using a longer life will REDUCE your annual depreciation deduction, meaning a smaller tax benefit each year.\n\n' +
          'The ATO may require you to justify this longer life if audited.\n\n' +
          'Consider using ' + standardLife + ' years for maximum tax benefit.'
        );
      }, 100);
    }
  } else if (enteredValue && enteredValue <= standardLife) {
    // Hide warning if using shorter or equal life
    warningDiv.style.display = 'none';
    inputEl.removeAttribute('data-warned');
  } else if (!enteredValue || isNaN(enteredValue)) {
    warningDiv.style.display = 'none';
    inputEl.removeAttribute('data-warned');
  }
}

function onCostIncChange() {
  var incEl = document.getElementById('am-cost-inc');
  var exEl  = document.getElementById('am-cost-ex');
  if (incEl && exEl && incEl.value) {
    exEl.value = round2(parseFloat(incEl.value) / 1.1);
  }
  updateModalPreview();
}

function highlightMethod() {
  var dvLbl = document.getElementById('lbl-dv');
  var pcLbl = document.getElementById('lbl-pc');
  var isDV  = document.getElementById('am-dv') && document.getElementById('am-dv').checked;
  if (dvLbl) dvLbl.style.borderColor = isDV  ? 'var(--brand)' : 'var(--border)';
  if (pcLbl) pcLbl.style.borderColor = !isDV ? 'var(--brand)' : 'var(--border)';
}

function updateModalPreview() {
  var preview = document.getElementById('am-preview-content');
  if (!preview) return;

  var costEx  = parseFloat(document.getElementById('am-cost-ex')?.value) || 0;
  var dateInput = document.getElementById('am-date')?.value || '';
  var date = parseDMYtoISO(dateInput);
  var life    = parseFloat(document.getElementById('am-life')?.value) || 0;
  var busPct  = parseFloat(document.getElementById('am-buspct')?.value) || 100;
  var method  = (document.querySelector('input[name="am-method"]:checked') || {}).value || 'dv';

  if (!costEx || !date || !life) {
    preview.textContent = 'Fill in all required fields to see your estimate';
    return;
  }
  if (costEx < 300) {
    preview.innerHTML = '<span class="depn-warning-text">⚠️ Under $300 — claim as an immediate deduction in Expenses instead.</span>';
    return;
  }

  var tempAsset = { purchaseDate: date, costExGst: costEx, method: method, effectiveLife: life, businessUsePct: busPct };
  var calc = calcDepreciation(tempAsset);

  preview.innerHTML = `
    <div class="depn-preview-estimate">
      <div><span>Opening WDV: </span><strong>${UI.currencyFull(calc.openingValue)}</strong></div>
      <div class="depn-preview-deduction"><span>FY deduction: </span><strong>– ${UI.currencyFull(calc.depreciation)}</strong></div>
      <div><span>Closing WDV: </span><strong>${UI.currencyFull(calc.closingValue)}</strong></div>
    </div>
    <div class="depn-preview-meta">${busPct}% business use · ${method === 'dv' ? 'Diminishing Value' : 'Prime Cost'} · ${life}-year effective life</div>
  `;
}

function closeAssetModal() {
  var overlay = document.getElementById('asset-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

/* ─────────────────────────────────────────
   Save / Delete
───────────────────────────────────────── */
function saveAsset(editId) {
  var name     = (document.getElementById('am-name')?.value || '').trim();
  var assetType = document.getElementById('am-type')?.value || '';
  var purchDateInput = document.getElementById('am-date')?.value || '';
  var purchDate = parseDMYtoISO(purchDateInput);
  var costInc  = parseFloat(document.getElementById('am-cost-inc')?.value) || 0;
  var costEx   = parseFloat(document.getElementById('am-cost-ex')?.value)  || 0;
  var lifeInput = document.getElementById('am-life')?.value;
  var life = lifeInput ? parseFloat(lifeInput) : null;
  var busPct   = parseFloat(document.getElementById('am-buspct')?.value)   || 100;
  var method   = (document.querySelector('input[name="am-method"]:checked') || {}).value || 'dv';

  if (!name) { alert('Asset name is required.'); return; }
  if (!assetType) { alert('Please select an asset type.'); return; }
  if (!purchDate) { alert('Please enter a valid date in dd/mm/yyyy format.'); return; }
  if (!life || life <= 0) { alert('Effective life is required. Select an asset type to auto-fill, or enter a number.'); return; }
  if (costEx < 300) {
    alert('Cost excluding GST must be at least $300. Assets under $300 should be claimed as an immediate deduction in Expenses.');
    return;
  }
  if (!life || life <= 0) { alert('Effective life must be greater than 0.'); return; }

  if (!AppData.assets) AppData.assets = [];

  if (editId) {
    var idx = AppData.assets.findIndex(function(a){ return a.id === editId; });
    if (idx > -1) {
      AppData.assets[idx] = Object.assign({}, AppData.assets[idx], {
        name: name, assetType: assetType, purchaseDate: purchDate,
        purchaseCost: costInc, costExGst: costEx,
        effectiveLife: life, businessUsePct: busPct, method: method
      });
    }
  } else {
    AppData.assets.push({
      id: 'asset-' + Date.now(),
      name: name, assetType: assetType, purchaseDate: purchDate,
      purchaseCost: costInc, costExGst: costEx,
      effectiveLife: life, businessUsePct: busPct, method: method,
      sourceExpenseId: null,
    });
  }

  closeAssetModal();
  refreshDepreciation();
  showDepreciationToast(editId ? '✓ Asset updated' : '✓ Asset added to register');
}

function deleteAsset(id) {
  if (!confirm('Remove this asset from the register? This cannot be undone.')) return;
  AppData.assets = (AppData.assets || []).filter(function(a){ return a.id !== id; });
  closeAssetModal();
  refreshDepreciation();
  showDepreciationToast('Asset removed from register');
}

/* ─────────────────────────────────────────
   Pending assets from Expenses screen
───────────────────────────────────────── */
function promotePendingAsset(id) {
  var pa = (AppData.depreciableAssets || []).find(function(a){ return a.id === id; });
  if (!pa) return;
  pa.status = 'handled';
  openAddAssetModal({
    name:          pa.description,
    purchaseDate:  pa.purchaseDate,
    purchaseCost:  pa.purchaseAmount,
    costExGst:     round2(pa.purchaseAmount / 1.1),
    assetType:     pa.suggestedType || 'other',
    effectiveLife: pa.suggestedLife || 5,
    businessUsePct: 100,
    method:        'dv',
  });
}

function dismissPendingAsset(id) {
  var pa = (AppData.depreciableAssets || []).find(function(a){ return a.id === id; });
  if (pa) pa.status = 'dismissed';
  refreshDepreciation();
}

/* ─────────────────────────────────────────
   CSV Export
───────────────────────────────────────── */
function exportDepreciationCSV() {
  var assets = (AppData.assets || []).map(function(a){
    var c = calcDepreciation(a);
    return Object.assign({}, a, c);
  });
  if (!assets.length) return;

  var rows = [
    'Asset,Type,Method,Purchased,Life (yrs),Business %,Cost ex GST,Opening WDV,FY Deduction,Closing WDV'
  ].concat(assets.map(function(a){
    return '"' + a.name + '",'
      + '"' + getAssetTypeLabel(a.assetType) + '",'
      + (a.method === 'pc' ? 'Prime Cost' : 'Dim. Value') + ','
      + a.purchaseDate + ','
      + a.effectiveLife + ','
      + a.businessUsePct + '%,'
      + a.costExGst.toFixed(2) + ','
      + a.openingValue.toFixed(2) + ','
      + a.depreciation.toFixed(2) + ','
      + a.closingValue.toFixed(2);
  }));

  var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  var url  = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href     = url;
  link.download = 'taxlyy_depreciation_FY2024-25.csv';
  link.click();
  URL.revokeObjectURL(url);
  showDepreciationToast('✓ CSV exported');
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function refreshDepreciation() {
  var screen = document.getElementById('screen-depreciation');
  if (!screen) return;
  var parsed = new DOMParser().parseFromString(buildDepreciation(), 'text/html');
  var ns = parsed.getElementById('screen-depreciation');
  if (ns) screen.innerHTML = ns.innerHTML;
}

function showDepreciationToast(msg) {
  var existing = document.querySelector('.depn-toast');
  if (existing) existing.remove();
  var t = document.createElement('div');
  t.className = 'depn-toast upload-success-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 3000);
}

function escD(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}