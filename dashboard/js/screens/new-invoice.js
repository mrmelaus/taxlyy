/* ─────────────────────────────────────────
   screens/new-invoice.js
   Full invoice builder — all features
───────────────────────────────────────── */

/* ── Invoice state ── */
var InvoiceState = {
  invoiceNumber: '',
  prefix:        'INV',
  issueDate:     new Date().toISOString().split('T')[0],
  dueDate:       '',
  termsDays:     14,
  customDueDate: false,
  clientId:      null,
  clientName:    '',
  clientAbn:     '',
  clientEmail:   '',
  clientAddress: '',
  clientPhone:   '',
  saveClient:    false,
  referenceNo:   '',
  currency:      'AUD',
  accountId:     '',
  gstEnabled:    true,
  discountType:  'none',
  discountValue: 0,
  lineItems:     [],
  notes:         'Thank you for your business.',
  terms:         '',
  accentColor:   '#008b8b',
  status:        'draft',
  subtotal:      0,
  gstTotal:      0,
  discountAmt:   0,
  grandTotal:    0,
  nextLineId:    2,
};

/* Make globally available */
window.buildPrintHtml = buildPrintHtml;

/* ── Date helpers ── */
function calcDueDate(issueDate, days) {
  if (!issueDate) return '';
  const date = new Date(issueDate + 'T00:00:00');
  date.setDate(date.getDate() + parseInt(days));
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(iso) {
  if (!iso) return '';
  const date = new Date(iso + 'T00:00:00');
  const mon  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${date.getDate()} ${mon[date.getMonth()]} ${date.getFullYear()}`;
}

function daysBetween(from, to) {
  if (!from || !to) return 0;
  return Math.round((new Date(to) - new Date(from)) / 86400000);
}

/* ── Currency formatter ── */
function fmtCurrency(n, currencyCode) {
  const currency = AppData.getCurrency(currencyCode || InvoiceState.currency);
  const abs      = Math.abs(Number(n)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${currency.symbol}${abs}`;
}

/* ── Recalculate engine ── */
function recalculate() {
  const inv = InvoiceState;
  let subtotal = 0;

  inv.lineItems.forEach(lineItem => {
    subtotal += parseFloat(lineItem.qty || 0) * parseFloat(lineItem.unitPrice || 0);
  });

  let discountAmt = 0;
  if (inv.discountType === 'pct')   discountAmt = subtotal * (parseFloat(inv.discountValue || 0) / 100);
  if (inv.discountType === 'fixed') discountAmt = parseFloat(inv.discountValue || 0);
  discountAmt = Math.min(Math.max(discountAmt, 0), subtotal);

  const discountRatio = subtotal > 0 ? (1 - discountAmt / subtotal) : 1;

  let gstTotal = 0;
  if (inv.gstEnabled) {
    inv.lineItems.forEach(lineItem => {
      if (lineItem.gstApplies) {
        const lineAmt = parseFloat(lineItem.qty || 0) * parseFloat(lineItem.unitPrice || 0);
        gstTotal += lineAmt * discountRatio * 0.10;
      }
    });
  }

  inv.subtotal    = subtotal;
  inv.gstTotal    = gstTotal;
  inv.discountAmt = discountAmt;
  inv.grandTotal  = (subtotal - discountAmt) + gstTotal;

  renderTotals();
  renderLineItemTotals();
}

/* ── Render totals panel ── */
function renderTotals() {
  const inv    = InvoiceState;
  const totals = document.getElementById('inv-totals');
  if (!totals) return;

  let html = '';

  if (inv.discountAmt > 0) {
    html += `<div class="total-row"><span class="total-label">Subtotal</span><span class="total-val">${fmtCurrency(inv.subtotal)}</span></div>`;
    html += `<div class="total-row"><span class="total-label">Discount${inv.discountType === 'pct' ? ' (' + inv.discountValue + '%)' : ''}</span><span class="total-val" style="color:var(--coral)">– ${fmtCurrency(inv.discountAmt)}</span></div>`;
  } else {
    html += `<div class="total-row"><span class="total-label">Subtotal${inv.gstEnabled ? ' (ex GST)' : ''}</span><span class="total-val">${fmtCurrency(inv.subtotal)}</span></div>`;
  }

  if (inv.gstEnabled) {
    html += `<div class="total-row"><span class="total-label">GST (10%)</span><span class="total-val">${fmtCurrency(inv.gstTotal)}</span></div>`;
  }

  const label = inv.currency !== 'AUD' ? `Total (${inv.currency})` : 'Total amount due';
  html += `<div class="total-row grand"><span>${label}</span><span>${fmtCurrency(inv.grandTotal)}</span></div>`;
  totals.innerHTML = html;
}

/* ── Render per-line amounts ── */
function renderLineItemTotals() {
  InvoiceState.lineItems.forEach(lineItem => {
    const cell = document.getElementById(`li-total-${lineItem.id}`);
    if (cell) cell.textContent = fmtCurrency(parseFloat(lineItem.qty || 0) * parseFloat(lineItem.unitPrice || 0));
  });
}

/* ── Build units <select> ── */
function unitsSelect(selected, lineId) {
  const opts = AppData.units.map(unit =>
    `<option value="${unit.label}" ${unit.label === selected ? 'selected' : ''}>${unit.label}</option>`
  ).join('');
  return `<select class="li-input" style="cursor:pointer;width:100%;padding:4px 2px"
    onchange="updateLineItem(${lineId},'unit',this.value)">
    ${opts}
    <option disabled>──</option>
    <option value="__custom__">+ Custom</option>
  </select>`;
}
/* ── Get service items for current client ── */
function getInvoiceServiceItems() {
  var items = [];
  // Priority 1: client service overrides
  if (InvoiceState.clientId) {
    var client = AppData.clients.find(function(c) { return c.id === InvoiceState.clientId; });
    if (client && client.serviceOverrides && client.serviceOverrides.length > 0) {
      return client.serviceOverrides;
    }
  }
  // Priority 2: global service library
  (AppData.user.serviceCategories || []).forEach(function(cat) {
    (cat.items || []).forEach(function(item) { items.push(item); });
  });
  return items;
}

/* ── Build description select for line item ── */
function descriptionSelect(row) {
    var items = getInvoiceServiceItems();
    var opts = '<option value="">— Select service or type below —</option>' +
      items.map(function(item) {
        return `<option value="${item.description}"
          data-refcode="${item.refCode || ''}"
          data-price="${item.price || 0}"
          data-unit="${item.unit || 'unit'}">
          ${item.description}
        </option>`;
      }).join('') +
      '<option value="__custom__">Custom...</option>';

    var hasSelection = row.description && items.some(function(i) {
      return i.description === row.description;
    });

    return `<select class="li-input" style="padding:4px 2px;width:100%;cursor:pointer"
      onchange="applyServiceItem(${row.id}, this)">
      ${opts}
    </select>`;
  }
function applyServiceItem(lineId, selectEl) {
    var val = selectEl.value;
    var lineItem = InvoiceState.lineItems.find(function(i) { return i.id === lineId; });
    if (!lineItem) return;

    if (val === '__custom__') {
      // Clear selection, let user type in description input
      selectEl.value = '';
      lineItem.description = '';
      lineItem.refNumber   = '';
      lineItem.unitPrice   = 0;
      renderLineItems();
      // Focus the description input after render
      setTimeout(function() {
        var descInput = document.querySelector('#line-row-' + lineId + ' .li-desc-input');
        if (descInput) descInput.focus();
      }, 50);
      return;
    }

    if (!val) return;

    // Get data from selected option
    var opt = selectEl.options[selectEl.selectedIndex];
    lineItem.description = val;
    lineItem.refNumber   = opt.getAttribute('data-refcode') || '';
    lineItem.unitPrice   = parseFloat(opt.getAttribute('data-price')) || 0;
    lineItem.unit        = opt.getAttribute('data-unit') || 'unit';
    recalculate();
    if (typeof InvoicePreview !== 'undefined') InvoicePreview.refresh();
    renderLineItems();
  }


/* ─────────────────────────────────────────
   PATCH for new-invoice.js
   Replace these three functions only.
   Everything else stays the same.
───────────────────────────────────────── */

/* ════════════════════════════════════════
   2. renderLineItems()
   Replace entire existing function.
════════════════════════════════════════ */
function renderLineItems() {
    const container = document.getElementById('line-items-body');
    if (!container) return;
    const inv = InvoiceState;

    container.innerHTML = inv.lineItems.map(row => `
      <div class="line-item-row" id="line-row-${row.id}"
        style="grid-template-columns:2.5fr 80px 90px 130px 120px${inv.gstEnabled ? ' 70px' : ''} 44px">

        <!-- Description cell: dropdown + ref + description input -->
        <div class="li-cell" style="padding:8px 10px;display:flex;flex-direction:column;gap:4px">
          ${descriptionSelect(row)}
          <input class="li-input li-desc-input"
            style="padding:4px 0;color:var(--text)"
            placeholder="Description"
            value="${row.description || ''}"
            oninput="updateLineItem(${row.id},'description',this.value)" />
          <input class="li-input"
            style="padding:4px 0;font-weight:600;color:var(--text3)"
            placeholder="Ref # (optional)"
            value="${row.refNumber || ''}"
            oninput="updateLineItem(${row.id},'refNumber',this.value);
              if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()" />
        </div>

        <div class="li-cell" style="padding:8px 6px">
          <input class="li-input" type="number" min="0" step="any"
            value="${row.qty}" style="text-align:center;padding:4px 2px"
            oninput="updateLineItem(${row.id},'qty',this.value)" />
        </div>

        <div class="li-cell" style="padding:8px 4px">
          ${unitsSelect(row.unit, row.id)}
        </div>

        <div class="li-cell" style="padding:8px 6px">
          <div style="display:flex;align-items:center;gap:2px">
            <span style="color:var(--text3);flex-shrink:0">
              ${AppData.getCurrency(inv.currency).symbol}
            </span>
            <input class="li-input" type="number" min="0" step="any"
              value="${row.unitPrice}" style="padding:4px 2px"
              oninput="updateLineItem(${row.id},'unitPrice',this.value)" />
          </div>
        </div>

        <div class="li-cell" id="li-total-${row.id}"
          style="padding:8px 10px;color:var(--text);display:flex;align-items:center">
          ${fmtCurrency(parseFloat(row.qty||0) * parseFloat(row.unitPrice||0))}
        </div>

        ${inv.gstEnabled ? `
        <div class="li-cell"
          style="padding:8px 6px;display:flex;align-items:center;justify-content:center">
          <label style="display:flex;align-items:center;gap:4px;cursor:pointer;color:var(--text3)">
            <input type="checkbox" ${row.gstApplies ? 'checked' : ''}
              style="accent-color:var(--brand);cursor:pointer"
              onchange="updateLineItem(${row.id},'gstApplies',this.checked)" />
            GST
          </label>
        </div>` : ''}

        <div class="li-cell"
          style="padding:8px 6px;display:flex;align-items:center;justify-content:center">
          ${inv.lineItems.length > 1
            ? `<button class="btn btn-ghost btn-sm"
                style="color:var(--coral);padding:2px 6px"
                onclick="removeLineItem(${row.id})">✕</button>`
            : `<span style="width:28px"></span>`}
        </div>
      </div>
    `).join('');

    recalculate();
  }
 
 
/* ════════════════════════════════════════
   3. addLineItem()
   Replace entire existing function.
════════════════════════════════════════ */
function addLineItem() {
  InvoiceState.lineItems.push({
    id:          InvoiceState.nextLineId++,
    refNumber:   '',
    description: '',
    qty:         1,
    unit:        'unit',
    unitPrice:   0,
    gstApplies:  true,
  });
  renderLineItems();
  if (typeof InvoicePreview !== 'undefined') {
    InvoicePreview.refresh();
  }
}
 
 
/* ── Initial line items in buildNewInvoice — update the reset block ── */

function removeLineItem(id) {
  if (InvoiceState.lineItems.length <= 1) return;
  InvoiceState.lineItems = InvoiceState.lineItems.filter(lineItem => lineItem.id !== id);
  renderLineItems();

  if (typeof InvoicePreview !== 'undefined') {
    InvoicePreview.refresh();
  }
}

function updateLineItem(id, field, value) {
  const lineItem = InvoiceState.lineItems.find(item => item.id === id);
  if (!lineItem) return;
  if (field === 'unit' && value === '__custom__') {
    const custom = prompt('Enter your custom unit (e.g. "sqm", "litre"):');
    if (custom && custom.trim()) {
      AppData.units.push({ id:'u-custom-'+Date.now(), label:custom.trim() });
      lineItem.unit = custom.trim();
      renderLineItems(); return;
    }
  }
  lineItem[field] = value;
  recalculate();

  if (typeof InvoicePreview !== 'undefined') {
    InvoicePreview.refresh();
  }
}

/* ── Client quick-select ── */
function applyClient(clientId) {
  if (!clientId) return;
  const client = AppData.clients.find(c => c.id === clientId);
  if (!client) return;
  InvoiceState.clientId      = client.id;
  InvoiceState.clientName    = client.name;
  InvoiceState.clientAbn     = client.abn;
  InvoiceState.clientEmail   = client.email;
  InvoiceState.clientAddress = client.address;
  InvoiceState.clientPhone   = client.phone;
  if (client.defaultAccountId) InvoiceState.accountId = client.defaultAccountId;
  if (client.defaultTermsDays) {
    InvoiceState.termsDays = client.defaultTermsDays;
    InvoiceState.dueDate   = calcDueDate(InvoiceState.issueDate, client.defaultTermsDays);
  }
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal('inv-client-name',    client.name);
  setVal('inv-client-abn',     client.abn);
  setVal('inv-client-email',   client.email);
  setVal('inv-client-address', client.address);
  setVal('inv-client-phone',   client.phone);
  setVal('inv-terms',          client.defaultTermsDays || 14);
  setVal('inv-due-date',       InvoiceState.dueDate);
  setVal('inv-account',        InvoiceState.accountId);
  updateDueDateDisplay();
  if (typeof InvoicePreview !== 'undefined') InvoicePreview.refresh();
}

/* ── Payment terms ── */
function handleTermsChange(val) {
  const customRow = document.getElementById('custom-due-row');
  if (val === 'custom') {
    InvoiceState.customDueDate = true;
    if (customRow) customRow.style.display = 'flex';
  } else {
    InvoiceState.customDueDate = false;
    if (customRow) customRow.style.display = 'none';
    InvoiceState.termsDays = parseInt(val);
    InvoiceState.dueDate   = calcDueDate(InvoiceState.issueDate, val);
    const dueDateInput = document.getElementById('inv-due-date');
    if (dueDateInput) dueDateInput.value = InvoiceState.dueDate;
    updateDueDateDisplay();
  }
}

function updateDueDateDisplay() {
  const displayEl = document.getElementById('due-date-display');
  if (!displayEl) return;
  const days = daysBetween(InvoiceState.issueDate, InvoiceState.dueDate);
  if (InvoiceState.dueDate) {
    displayEl.textContent = `Due ${formatDateDisplay(InvoiceState.dueDate)} — ${days} day${days !== 1 ? 's' : ''}`;
    displayEl.style.color = days <= 7 ? 'var(--gold)' : 'var(--text3)';
  } else {
    displayEl.textContent = '';
  }
}

/* ── GST toggle ── */
function toggleGst(enabled) {
  InvoiceState.gstEnabled = enabled;
  const titleEl = document.getElementById('inv-doc-title');
  if (titleEl) titleEl.textContent = enabled ? 'Tax Invoice' : 'Invoice';
  renderLineItems();
  recalculate();
}

/* ── Currency ── */
function handleCurrencyChange(code) {
  InvoiceState.currency = code;
  if (code !== 'AUD') {
    InvoiceState.gstEnabled = false;
    const gstCheckbox = document.getElementById('gst-toggle-check');
    if (gstCheckbox) { gstCheckbox.checked = false; gstCheckbox.disabled = true; }
    const currencyNote = document.getElementById('gst-currency-note');
    if (currencyNote) currencyNote.style.display = 'block';
    toggleGst(false);
  } else {
    const gstCheckbox = document.getElementById('gst-toggle-check');
    if (gstCheckbox) { gstCheckbox.disabled = false; }
    const currencyNote = document.getElementById('gst-currency-note');
    if (currencyNote) currencyNote.style.display = 'none';
    const shouldEnableGst = AppData.user.gstRegistered;
    InvoiceState.gstEnabled = shouldEnableGst;
    const gstCheckbox2 = document.getElementById('gst-toggle-check');
    if (gstCheckbox2) gstCheckbox2.checked = shouldEnableGst;
    toggleGst(shouldEnableGst);
  }
  renderLineItems();
  recalculate();
}

/* ── Discount ── */
function handleDiscountType(type) {
  InvoiceState.discountType  = type;
  InvoiceState.discountValue = 0;
  const discountRow = document.getElementById('discount-value-row');
  if (discountRow) discountRow.style.display = type === 'none' ? 'none' : 'flex';
  recalculate();
}

/* ── Accent colour ── */
function applyAccentColor(color) {
  InvoiceState.accentColor = color;
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.style.border    = '2px solid transparent';
    swatch.style.boxShadow = 'none';
  });
  if (event && event.target) {
    const swatch = event.target.closest('.color-swatch');
    if (swatch) { swatch.style.border = '2px solid var(--aqua)'; swatch.style.boxShadow = '0 0 0 1px var(--teal)'; }
  }
}

/* ── Logo upload ── */
function handleLogoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = event => { AppData.user.branding.logo = event.target.result; };
  reader.readAsDataURL(file);
}

/* ── Build print / preview HTML ── */
/* ════════════════════════════════════════
   1. buildPrintHtml()
════════════════════════════════════════ */
function buildPrintHtml() {
  const inv      = InvoiceState;
  const user     = AppData.user;
  const currency = AppData.getCurrency(inv.currency);
  const account  = AppData.getAccount(inv.accountId);
  const isPaid   = user.plan !== 'free';
  const accent   = isPaid ? inv.accentColor : (user.branding?.accentColor || '#008b8b');
  const font     = "'Helvetica Neue', Helvetica, Arial, sans-serif";
 
  const fmt = n =>
    currency.symbol +
    Math.abs(Number(n)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
 
  const fmtDate = iso => {
    if (!iso) return '—';
    const d   = new Date(iso + 'T00:00:00');
    const mon = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                 'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
    return `${d.getDate()} ${mon[d.getMonth()]} ${d.getFullYear()}`;
  };
 
  /* ── Sender block - ALL UPPERCASE ── */
  const addressLines = user.address
    ? user.address.split(',').map(s => s.trim()).filter(Boolean)
        .map(l => `<div>${l.toUpperCase()}</div>`).join('')
    : '';
 
  const bizBlock = `
    <div style="font-size:11px;font-weight:700;color:${accent};line-height:1.4">
      ${user.businessName.toUpperCase()}
    </div>
    <div style="font-size:10px;font-weight:400;color:${accent};margin-top:2px">
      ABN ${user.abn}
    </div>
    <div style="font-size:10px;color:#6b7280;margin-top:8px;line-height:1.6">
      ${addressLines}
      <div>${user.email.toUpperCase()}</div>
      <div>${user.phone}</div>
    </div>`;
 
  const senderBlock = (user.branding.logo && isPaid)
    ? `<div style="display:flex;align-items:flex-start;gap:12px">
         <img src="${user.branding.logo}"
           style="max-height:48px;max-width:120px;object-fit:contain;flex-shrink:0;margin-top:2px">
         <div>${bizBlock}</div>
       </div>`
    : bizBlock;
 
  /* ── Line item rows ── */
  const lineRows = inv.lineItems.map((item, idx) => {
    const lineTotal = parseFloat(item.qty || 0) * parseFloat(item.unitPrice || 0);
    const refHtml   = item.refNumber
      ? `<div style="font-size:10px;font-weight:700;color:#4b5563;margin-bottom:2px">
           ${item.refNumber}
         </div>`
      : '';
    const descHtml = item.description
      ? `<div style="font-size:10px;color:#4b5563">${item.description}</div>`
      : '';
    const rowBg = idx % 2 === 1 ? 'background:#fafafa;' : '';
    return `<tr style="${rowBg}">
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;vertical-align:middle">
        ${refHtml}${descHtml || '<span style="font-size:10px;color:#9ca3af">—</span>'}
      </td>
     <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:10px;
        text-align:center;color:#374151;vertical-align:middle">
        ${item.qty} ${item.unit}
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:10px;
        text-align:right;color:#374151;vertical-align:middle">
        ${fmt(item.unitPrice)}
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:10px;
        text-align:right;font-weight:600;color:#111;vertical-align:middle">
        ${fmt(lineTotal)}
      </td>
    </tr>`;
  }).join('');
 
  /* ── Discount row ── */
  const discountRow = inv.discountAmt > 0 ? `
    <tr>
      <td colspan="3" style="padding:6px 10px;border-bottom:1px solid #e5e7eb;
        font-size:10px;text-align:right;color:#6b7280">
        DISCOUNT${inv.discountType === 'pct' ? ' (' + inv.discountValue + '%)' : ''}
      </td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;
        font-size:10px;text-align:right;color:#ef4444">
        – ${fmt(inv.discountAmt)}
      </td>
    </table>` : '';
 
  /* ── GST row ── */
  const gstRow = inv.gstEnabled && inv.gstTotal > 0 ? `
    <tr>
      <td colspan="3" style="padding:6px 10px;border-bottom:1px solid #e5e7eb;
        font-size:10px;text-align:right;color:#6b7280">GST (10%)</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;
        font-size:10px;text-align:right;color:#374151">
        ${fmt(inv.gstTotal)}
       </td>
     </tr>` : '';
 
  /* ── Payment info lines ── */
  const payLines = [];
  if (account) {
    if (account.bsb)         payLines.push(`BSB: ${account.bsb}`);
    if (account.accountNo)   payLines.push(`ACCOUNT NO.: ${account.accountNo}`);
    if (account.accountName) payLines.push(`ACCOUNT NAME: ${account.accountName.toUpperCase()}`);
    if (account.payId)       payLines.push(`PAYID: ${account.payId}`);
  }
  payLines.push(`REFERENCE: ${inv.invoiceNumber}`);
 
  /* ── Bill-to block - ALL UPPERCASE ── */
  const clientAddressLines = inv.clientAddress
    ? inv.clientAddress.split(',').map(s => s.trim()).filter(Boolean)
        .map(l => `<div>${l.toUpperCase()}</div>`).join('')
    : '';
 
  /* ════════════════════════════════════════
     FULL HTML
  ════════════════════════════════════════ */
  return `
<div style="font-family:${font};max-width:720px;margin:0 auto;background:#fff;
  color:#111;padding:48px 40px 40px 40px;box-sizing:border-box;
  min-height:297mm;position:relative;">
   
  <!-- ══ ROW 1: TAX INVOICE (right aligned) ══ -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
    <div style="font-size:18px;font-weight:700;color:${accent};
      text-transform:uppercase;letter-spacing:0.04em;line-height:1">
      ${inv.gstEnabled ? 'TAX INVOICE' : 'INVOICE'}
    </div>
  </div>
 
  <!-- ══ ROW 2: Business info (left) + Invoice meta (right) ══ -->
  <div style="display:flex;justify-content:space-between;
    align-items:flex-start;margin-bottom:24px">
 
    <!-- Sender block -->
    <div style="flex:1;max-width:55%">${senderBlock}</div>
 
    <!-- Invoice meta -->
    <div style="text-align:right">
      <div style="margin-bottom:6px">
        <span style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em">INVOICE NO</span>
        <span style="font-size:10px;font-weight:600;color:#111;margin-left:12px;display:inline-block;min-width:100px;text-align:right">${inv.invoiceNumber}</span>
      </div>
      <div style="margin-bottom:6px">
        <span style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em">INVOICE DATE</span>
        <span style="font-size:10px;font-weight:600;color:#111;margin-left:12px;display:inline-block;min-width:100px;text-align:right">${fmtDate(inv.issueDate)}</span>
      </div>
      <div>
        <span style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em">DUE DATE</span>
        <span style="font-size:10px;font-weight:600;color:#111;margin-left:12px;display:inline-block;min-width:100px;text-align:right">${fmtDate(inv.dueDate)}</span>
      </div>
    </div>
  </div>
 
  <!-- ══ DIVIDER ══ -->
  <div style="height:2px;background:${accent};margin-bottom:20px;border-radius:1px"></div>
 
  <!-- ══ BILL TO BLOCK ══ -->
  <div style="margin-bottom:24px">
    <div style="font-size:10px;font-weight:600;text-transform:uppercase;
      letter-spacing:0.08em;color:${accent};margin-bottom:8px">BILL TO</div>
    ${inv.clientName
      ? `<div style="font-size:11px;font-weight:700;color:${accent}">${inv.clientName.toUpperCase()}</div>`
      : '<div style="font-size:10px;color:#9ca3af">—</div>'}
    ${inv.clientAbn
      ? `<div style="font-size:10px;font-weight:400;color:${accent};margin-top:2px">ABN ${inv.clientAbn}</div>`
      : ''}
    ${clientAddressLines
      ? `<div style="font-size:10px;color:#6b7280;margin-top:6px;line-height:1.5">
           ${clientAddressLines}
         </div>`
      : ''}
    ${inv.clientEmail
      ? `<div style="font-size:10px;color:#6b7280;margin-top:2px">${inv.clientEmail.toUpperCase()}</div>` : ''}
    ${inv.clientPhone
      ? `<div style="font-size:10px;color:#6b7280">${inv.clientPhone}</div>` : ''}
  </div>
 
  <!-- ══ LINE ITEMS TABLE with DARK HEADER ══ -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <!-- Accent top line -->
      <tr>
        <td colspan="4" style="padding:0;height:2px;background:${accent};font-size:0;line-height:0"></td>
      </tr>
      <!-- Light gray header row with black text -->
      <tr style="background:#f3f4f6">
        <th style="padding:10px 10px;text-align:left;font-size:10px;font-weight:600;
          color:#111;text-transform:uppercase;letter-spacing:0.06em;border:none">
          DESCRIPTION
        </th>
        <th style="padding:10px 10px;text-align:center;font-size:10px;font-weight:600;
          color:#111;text-transform:uppercase;letter-spacing:0.06em;border:none">
          UNIT
        </th>
        <th style="padding:10px 10px;text-align:right;font-size:10px;font-weight:600;
          color:#111;text-transform:uppercase;letter-spacing:0.06em;border:none">
          RATE
        </th>
        <th style="padding:10px 10px;text-align:right;font-size:10px;font-weight:600;
          color:#111;text-transform:uppercase;letter-spacing:0.06em;border:none;
          white-space:nowrap">
          TOTAL (${inv.currency})
        </th>
      </tr>
      <!-- Accent bottom line under header -->
      <tr>
        <td colspan="4" style="padding:0;height:2px;background:${accent};font-size:0;line-height:0"></td>
      </tr>
    </thead>
    <tbody>
      ${lineRows}
      ${discountRow}
      ${gstRow}
    </tbody>
    <tfoot>
      <tr style="border-top:2px solid ${accent}">
        <td colspan="3" style="padding:10px 10px 6px 10px;text-align:right;font-size:10px;font-weight:600;color:#6b7280">TOTAL DUE</td>
        <td style="padding:10px 10px 6px 10px;text-align:right;font-size:14px;font-weight:700;color:${accent}">${fmt(inv.grandTotal)}</td>
      </tr>
    </tfoot>
  </table>
 
  <!-- ══ BOTTOM: Payment + Amount Due pushed to bottom with margin-top:auto ══ -->
  <div style="position:absolute;bottom:60px;left:40px;right:40px;">
    
    <!-- Row 1: Payment label (left) + Amount Due (right) -->
    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom: 12px;">
      <div style="font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:${accent};">
        PAYMENT INFORMATION
      </div>
      <div style="text-align:right;">
        <div style="height:2px; background:${accent}; margin-bottom:6px; width:100%;"></div>
        <span style="font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:#374151;">AMOUNT DUE:</span>
        <span style="font-size:16px; font-weight:700; color:${accent}; margin-left:8px;">${fmt(inv.grandTotal)}</span>
      </div>
    </div>
    
    <!-- Row 2: Payment details -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div style="flex:1;">
        <div style="font-size:10px; color:#374151; line-height: 1.8;">
          ${payLines.map(line => `<div>${line}</div>`).join('')}
        </div>
        ${inv.notes ? `
          <div style="margin-top:12px; font-size:10px; color:#6b7280; line-height:1.5;">
            ${inv.notes}
          </div>` : ''}
      </div>
      <div style="width:160px;"></div>
    </div>
    
  </div>
 
  <!-- ══ TERMS ══ -->
  ${inv.terms ? `
  <div style="margin-top:16px; font-size:9px; color:#9ca3af; line-height:1.5; border-top:1px solid #e5e7eb; padding-top:12px;">
    ${inv.terms.toUpperCase()}
  </div>` : ''}
 
</div>`;
}
 
/* ── Preview modal ── */
function openPreview() {
  const modal   = document.getElementById('inv-preview-modal');
  const content = document.getElementById('inv-preview-content');
  if (!modal || !content) return;
  
  // Wrap the HTML in the SAME A4 wrapper as live preview
  const html = buildPrintHtml();
  content.innerHTML = '<div class="a4-preview" style="width:210mm;min-height:297mm;background:white;margin:0 auto;">' + html + '</div>';
  
  modal.style.display = 'flex';
}

function closePreview() {
  const modal = document.getElementById('inv-preview-modal');
  if (modal) modal.style.display = 'none';
}

/* ── Download PDF ── */
/* ── Check and offer to save new client ── */
function checkSaveNewClient(callback) {
  if (
    InvoiceState.clientName &&
    !InvoiceState.clientId &&
    confirm('"' + InvoiceState.clientName + '" is not saved in your clients list. Save them now?')
  ) {
    var newClient = {
      id:               'cl-' + Date.now(),
      name:             InvoiceState.clientName,
      abn:              InvoiceState.clientAbn     || '',
      email:            InvoiceState.clientEmail   || '',
      phone:            InvoiceState.clientPhone   || '',
      address:          InvoiceState.clientAddress || '',
      contactName:      '',
      defaultTermsDays: InvoiceState.termsDays || 14,
      defaultAccountId: InvoiceState.accountId || '',
      invoicePrefix:    InvoiceState.clientName.substring(0,3).toUpperCase(),
      notes:            '',
      serviceOverrides: [],
      totalInvoiced:    0,
      lastInvoice:      '—',
    };
    AppData.clients.unshift(newClient);
    InvoiceState.clientId = newClient.id;
  }
  if (callback) callback();
}

/* ── Download PDF ── */
function downloadInvoicePdf() {
  checkSaveNewClient(function() {
    const win = window.open('', '_blank');
    if (!win) { alert('Please allow popups to download the PDF.'); return; }
    win.document.write(`<!DOCTYPE html><html><head>
      <title>${InvoiceState.invoiceNumber}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact; }
        @media print {
          @page { margin: 0; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head><body>${buildPrintHtml()}
    <script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}<\/script>
    </body></html>`);
    win.document.close();
  });
}

/* ── Save draft ── */
function saveDraft() {
  checkSaveNewClient(function() {
    InvoiceState.status = 'draft';
    const btn = document.getElementById('save-draft-btn');
    if (!btn) return;
    const originalLabel = btn.textContent;
    btn.textContent = 'Saved ✓';
    btn.style.color = 'var(--green)';
    setTimeout(() => { btn.textContent = originalLabel; btn.style.color = ''; }, 2000);
  });
}

/* ── Main builder ── */
function buildNewInvoice() {
  const user   = AppData.user;
  const isPaid = user.plan !== 'free';

  /* Reset state */
  Object.assign(InvoiceState, {
    invoiceNumber: AppData.getNextInvoiceNumber(),
    prefix:        user.invoiceNumbering.format,
    issueDate:     new Date().toISOString().split('T')[0],
    termsDays:     14,
    customDueDate: false,
    clientId:      null, clientName:'', clientAbn:'', clientEmail:'', clientAddress:'', clientPhone:'',
    saveClient:    false,
    referenceNo:   '',
    currency:      'AUD',
    accountId:     AppData.paymentAccounts.find(acc => acc.isDefault)?.id || AppData.paymentAccounts[0]?.id || '',
    gstEnabled:    user.gstRegistered,
    discountType:  'none', discountValue: 0,
    lineItems: [{ id:1, refNumber:'', description:'', qty:1, unit:'unit', unitPrice:0, gstApplies:true }],
    notes:         '',
    terms:         '',
    accentColor:   user.branding.accentColor || '#008b8b',
    status:        'draft',
    nextLineId:    2,
  });
  InvoiceState.dueDate = calcDueDate(InvoiceState.issueDate, 14);

  /* Option builders */
  const clientOpts   = AppData.clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('');
  const accountOpts  = AppData.paymentAccounts.map(acc => `<option value="${acc.id}" ${acc.isDefault ? 'selected' : ''}>${acc.nickname}</option>`).join('');
  const currencyOpts = AppData.currencies.map(cur => `<option value="${cur.code}" ${cur.code === 'AUD' ? 'selected' : ''}>${cur.code} — ${cur.name}</option>`).join('');

  /* Colour swatches */
  const swatchColors = ['#008b8b','#0c8b69','#111827','#7c3aed','#b45309','#dfa41c'];
  const swatches = isPaid ? `
    <div class="form-group" style="grid-column:span 2">
      <label class="form-label">Accent colour</label>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        ${swatchColors.map(color => `
          <div class="color-swatch" onclick="applyAccentColor('${color}')"
            style="width:28px;height:28px;border-radius:6px;background:${color};cursor:pointer;
            border:${color === InvoiceState.accentColor ? '2px solid var(--aqua)' : '2px solid transparent'};
            box-shadow:${color === InvoiceState.accentColor ? '0 0 0 1px var(--teal)' : 'none'}"></div>
        `).join('')}
        <input type="color" value="${InvoiceState.accentColor}"
          style="width:28px;height:28px;border:none;border-radius:6px;cursor:pointer;padding:0;background:none"
          title="Custom colour" onchange="InvoiceState.accentColor=this.value" />
        <span style="font-size:11px;color:var(--text3)">Custom</span>
      </div>
    </div>` : `
    <div class="form-group" style="grid-column:span 2">
      <div style="font-size:11px;color:var(--text3);padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm)">
        Upgrade to Starter or Pro to add your logo, custom colours and branding
      </div>
    </div>`;

  const logoField = isPaid ? `
    <div class="form-group">
      <label class="form-label">Logo (PNG / SVG / JPG)</label>
      <input type="file" accept="image/*" class="form-input" style="padding:6px" onchange="handleLogoUpload(this)" />
    </div>` : '';

  const brandingFields = isPaid ? `
    <div class="form-group">
      <label class="form-label">Header tagline (optional)</label>
      <input class="form-input" placeholder="Your trusted partner in growth"
        value="${user.branding.headerText}" oninput="AppData.user.branding.headerText=this.value" />
    </div>
    <div class="form-group">
      <label class="form-label">Footer text (optional)</label>
      <input class="form-input" placeholder="Thank you for your business"
        value="${user.branding.footerText}" oninput="AppData.user.branding.footerText=this.value" />
    </div>` : '';

  return `
    <div class="screen" id="screen-new-invoice">
      <!-- Preview modal -->
      <div id="inv-preview-modal" onclick="if(event.target===this)closePreview()"
        style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.78);
          align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto">
        <div style="background:#fff;border-radius:12px;width:100%;max-width:820px;position:relative;margin:auto">
          <div style="display:flex;justify-content:space-between;align-items:center;
            padding:14px 20px;border-bottom:1px solid #e5e7eb;border-radius:12px 12px 0 0;background:#f9fafb">
            <div style="font-size:14px;font-weight:600;color:#111">Invoice preview</div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary" onclick="downloadInvoicePdf()">Download PDF</button>
              <button class="btn btn-ghost" onclick="closePreview()">Close ✕</button>
            </div>
          </div>
          <div id="inv-preview-content" style="padding:28px;background:#f3f4f6;border-radius:0 0 12px 12px;display:flex;justify-content:center;align-items:center;"></div>
        </div>
      </div>

      <!-- Page header -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
          <div style="font-size:18px;font-weight:600;color:var(--text)" id="inv-doc-title">
            ${user.gstRegistered ? 'Tax Invoice' : 'Invoice'}
          </div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px">
            ${InvoiceState.invoiceNumber} · Draft
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost" id="save-draft-btn" onclick="saveDraft()">Save draft</button>
          <button class="btn btn-ghost" onclick="openPreview()">Preview</button>
          <button class="btn btn-primary" onclick="openPreview()">Download PDF →</button>
        </div>
      </div>

      <!-- TWO-COLUMN LAYOUT -->
      <div style="display:grid;grid-template-columns:1.2fr 0.9fr;gap:24px;align-items:start">
        
        <!-- ========== LEFT COLUMN - FORM ========== -->
        <div>
          
       <!-- SECTION 1: SENDER INFO - Collapsed by default -->
          <div class="card" style="margin-bottom:16px">
            <div class="card-header" style="cursor:pointer"
              onclick="var b=document.getElementById('sender-body');var c=document.getElementById('sender-chevron');if(b.style.display==='none'){b.style.display='block';c.style.transform='rotate(180deg)'}else{b.style.display='none';c.style.transform='rotate(0deg)'}">
              <div>
                <div class="card-title">${user.businessName.toUpperCase()}</div>
                <div class="card-sub" style="margin-top:6px">Your business details · <a href="#" onclick="event.stopPropagation();Router.go('settings');return false" style="color:var(--brand)">Edit in settings →</a></div>
              </div>
              <svg id="sender-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none"
                stroke="currentColor" stroke-width="1.5"
                style="transition:transform 0.2s;flex-shrink:0">
                <polyline points="4 6 8 10 12 6"/>
              </svg>
            </div>
            <div id="sender-body" style="display:none">
              <div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <div>
                    <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em">ABN</div>
                    <div style="font-size:13px">${user.abn}</div>
                  </div>
                  <div>
                    <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em">Email</div>
                    <div style="font-size:13px">${user.email}</div>
                  </div>
                  <div>
                    <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em">Phone</div>
                    <div style="font-size:13px">${user.phone}</div>
                  </div>
                  <div>
                    <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em">Address</div>
                    <div style="font-size:12px;color:var(--text2)">${user.address}</div>
                  </div>
                </div>
                <div style="margin-top:12px;font-size:11px;color:var(--text3)">
                  ABN changes require ASIC verification ·
                  <a href="#" onclick="Router.go('settings');return false" style="color:var(--brand)">
                    Update contact info in settings →
                  </a>
                </div>
              </div>
            </div>
          </div>
                    
          <!-- SECTION 2: INVOICE INFO (Number, Date, Due Date, Currency) -->
          <div class="card" style="margin-bottom:16px">
            <div class="card-header"><div class="card-title">Invoice details</div></div>
            <div class="card-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Invoice number</label>
                  <div style="display:flex;gap:6px">
                    <input class="form-input" style="width:72px" value="${user.invoiceNumbering.format}"
                      oninput="InvoiceState.prefix=this.value;document.getElementById('inv-number-display').value=this.value+'-'+String(AppData.user.invoiceNumbering.nextNumber).padStart(4,'0');if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()" />
                    <input class="form-input" id="inv-number-display" value="${InvoiceState.invoiceNumber}" readonly style="flex:1;opacity:0.65" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Issue date</label>
                  <input class="form-input" type="date" value="${InvoiceState.issueDate}"
                    onchange="InvoiceState.issueDate=this.value;if(!InvoiceState.customDueDate){InvoiceState.dueDate=calcDueDate(this.value,InvoiceState.termsDays);document.getElementById('inv-due-date').value=InvoiceState.dueDate;updateDueDateDisplay();}if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Payment terms</label>
                  <select class="form-input" id="inv-terms" onchange="handleTermsChange(this.value);if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()">
                    <option value="7">7 days</option><option value="14" selected>14 days</option>
                    <option value="21">21 days</option><option value="30">30 days</option>
                    <option value="60">60 days</option><option value="custom">Custom date →</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Due date</label>
                  <input class="form-input" type="date" id="inv-due-date" value="${InvoiceState.dueDate}"
                    onchange="InvoiceState.dueDate=this.value;updateDueDateDisplay();if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()" />
                  <div id="due-date-display" style="font-size:11px;color:var(--text3);margin-top:4px"></div>
                </div>
                <div class="form-group">
                  <label class="form-label">Currency</label>
                  <select class="form-input" id="inv-currency" onchange="handleCurrencyChange(this.value);if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()">
                    ${currencyOpts}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Reference / PO</label>
                  <input class="form-input" placeholder="Client PO or reference"
                    oninput="InvoiceState.referenceNo=this.value;if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()" />
                </div>
                ${user.gstRegistered ? `
                <div class="form-group">
                  <label class="form-label">GST</label>
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                    <input type="checkbox" id="gst-toggle-check" checked style="accent-color:var(--brand);width:16px;height:16px"
                      onchange="toggleGst(this.checked);if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()" />
                    <span style="font-size:13px">Apply GST (10%)</span>
                  </label>
                </div>` : ''}
              </div>
            </div>
          </div>
          
                   <!-- SECTION 3: BILLING INFO (Client details) -->
          <div class="card" style="margin-bottom:16px">
            <div class="card-header">
              <div class="card-title">Bill to</div>
              <div class="card-sub">ABN Lookup powered by ABR</div>
            </div>
            <div class="card-body">
              
              <!-- ABN LOOKUP UI - ADD THIS RIGHT HERE -->
              <div id="abn-lookup-container" style="margin-bottom: 16px;"></div>
              
              <div class="form-group" style="margin-bottom:12px">
                <label class="form-label">Quick select saved client</label>
                <select class="form-input" onchange="applyClient(this.value);if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()">
                  <option value="">— Select or fill in manually —</option>
                  ${clientOpts}
                </select>
              </div>
              <div class="form-grid">
                <div class="form-group" style="grid-column:span 2">
                  <label class="form-label">Client / company name</label>
                  <input class="form-input" id="inv-client-name" placeholder="Name"
                    oninput="InvoiceState.clientName=this.value;if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()" />
                </div>
                <div class="form-group">
                  <label class="form-label">ABN </label>
                  <input class="form-input" id="inv-client-abn" placeholder="XX XXX XXX XXX"
                    oninput="InvoiceState.clientAbn=this.value;if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input class="form-input" id="inv-client-email" placeholder="client@company.com.au"
                    oninput="InvoiceState.clientEmail=this.value;if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Phone</label>
                  <input class="form-input" id="inv-client-phone" placeholder="Phone"
                    oninput="InvoiceState.clientPhone=this.value;if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()" />
                </div>
                <div class="form-group" style="grid-column:span 2">
                  <label class="form-label">Address</label>
                  <input class="form-input" id="inv-client-address" placeholder="Client address"
                    oninput="InvoiceState.clientAddress=this.value;if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()" />
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 4: LINE ITEMS -->
          <div class="card" style="margin-bottom:16px">
            <div class="card-header"><div class="card-title">Line items</div></div>
            <div class="line-item-row line-item-header" style="grid-template-columns:2.5fr 80px 90px 130px 120px${InvoiceState.gstEnabled ? ' 70px' : ''} 44px">
              <div class="li-cell li-head">Description</div>
              <div class="li-cell li-head">Qty</div>
              <div class="li-cell li-head">Unit</div>
              <div class="li-cell li-head">Unit price</div>
              <div class="li-cell li-head">Amount</div>
              ${InvoiceState.gstEnabled ? '<div class="li-cell li-head" style="text-align:center">GST?</div>' : ''}
              <div class="li-cell li-head"></div>
            </div>
            <div id="line-items-body"></div>
            <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid var(--border);flex-wrap:wrap">
              <button class="btn btn-ghost" style="font-size:11px" onclick="addLineItem()">+ Add line item</button>
              <div style="flex:1"></div>
              <span style="font-size:11px;color:var(--text3)">Discount:</span>
              <select class="form-input" style="width:auto;padding:5px 8px;font-size:11px" onchange="handleDiscountType(this.value);if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()">
                <option value="none">None</option><option value="pct">Percentage (%)</option><option value="fixed">Fixed amount ($)</option>
              </select>
              <div id="discount-value-row" style="display:none;align-items:center;gap:6px">
                <input class="form-input" type="number" min="0" step="any" placeholder="0" style="width:90px;padding:5px 8px;font-size:11px"
                  oninput="InvoiceState.discountValue=this.value;recalculate();if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()" />
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;padding:16px 20px;border-top:1px solid var(--border)">
              <div class="invoice-totals" style="min-width:280px" id="inv-totals"></div>
            </div>
          </div>
          
          <!-- SECTION 5: NOTES & TERMS -->
          <div class="grid-2" style="margin-bottom:16px">
            <div class="form-group">
              <label class="form-label">Notes to client</label>
              <textarea class="form-input" rows="3" placeholder="Thank you for your business..."
                oninput="InvoiceState.notes=this.value;if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Terms & conditions</label>
              <textarea class="form-input" rows="3" 
  placeholder="Payment due within the above period. Late payments may incur a fee."
  oninput="InvoiceState.terms=this.value;if(typeof InvoicePreview!=='undefined')InvoicePreview.refresh()"></textarea>
            </div>
          </div>
          
        </div>
        
        <!-- ========== RIGHT COLUMN - LIVE A4 PREVIEW ========== -->
        <div>
          <div id="invoice-preview-container"></div>
        </div>
        
      </div>
    </div>
  `;
}

/* ── Called by main.js after screen renders ── */
function initNewInvoice() {
  if (!document.getElementById('line-items-body')) {
    console.warn('Taxlyy: initNewInvoice() skipped');
    return;
  }
  try {
    renderLineItems();
    recalculate();
    updateDueDateDisplay();
    
    // Initialize ABN Lookup - only once
    const abnContainer = document.getElementById('abn-lookup-container');
    if (abnContainer && typeof ABNLookup !== 'undefined' && abnContainer.children.length === 0) {
      const searchUI = ABNLookup.createSearchUI({
        placeholder: 'Enter 11-digit ABN or business name...',
        onSuccess: (businessData) => {
          console.log('Business found:', businessData.legalName);
        },
        onError: (error) => {
          console.warn('ABN error:', error);
        }
      });
      abnContainer.appendChild(searchUI);
    }
    
    // Initialize preview
    const previewContainer = document.getElementById('invoice-preview-container');
    if (previewContainer && typeof InvoicePreview !== 'undefined' && previewContainer.children.length === 0) {
      InvoicePreview.init('invoice-preview-container');
    }
    
  } catch (err) {
    console.error('initNewInvoice error:', err);
  }
}



