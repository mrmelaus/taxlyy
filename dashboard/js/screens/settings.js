/* ─────────────────────────────────────────
   js/screens/settings.js
───────────────────────────────────────── */

/* ── Settings state ── */
var SettingsState = {
  editingContactId: null,
  editingAccountId: null,
  editingCategoryId: null,
  editingCategoryName: null,  // Track inline category editing
};

/* ════════════════════════════════════════
   Main build function
════════════════════════════════════════ */
function buildSettings() {
  const u = AppData.user;
  const n = AppData.notifications;

  const plans = [
    {
      id: 'starter', name: 'Starter', price: '$8', suffix: '/mo',
      note: 'invoices only',
      features: ['Unlimited invoices', 'ATO-compliant PDFs', 'Client contacts']
    },
    {
      id: 'pro', name: 'Pro', price: '$19', suffix: '/mo',
      note: 'full tax features',
      features: ['Everything in Starter', '4 BAS reports/yr', 'Annual tax report', 'AI categorisation', 'Bank statement OCR']
    },
    {
      id: 'annual', name: 'Annual Pro', price: '$15', suffix: '/mo',
      note: 'billed $180/yr',
      features: ['Everything in Pro', 'Save $48 vs monthly', 'Rate lock guarantee']
    },
  ];

  return `
    <div class="screen" id="screen-settings">
      <div style="font-weight:600;color:var(--text);margin-bottom:20px">Settings</div>

      <!-- ══ SUBSCRIPTION PLAN (at the very top) ══ -->
      <div style="margin-bottom:24px">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Subscription plan</div>
              <div class="card-sub" style="color:var(--text3);margin-top:4px">
                Your current plan and billing information — controls which features are available
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="plan-cards">
              ${plans.map(p => `
                <div class="plan-card ${u.plan === p.id ? 'current' : ''}">
                  ${u.plan === p.id ? '<div class="current-badge">Current</div>' : ''}
                  <div class="plan-name">${p.name}</div>
                  <div class="plan-price">${p.price}<span>${p.suffix}</span></div>
                  <div style="color:var(--text3);margin-top:2px">${p.note}</div>
                  <div class="plan-features">
                    ${p.features.map(f => `<div class="plan-feature">${f}</div>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
      

      <!-- ══ TWO COLUMN LAYOUT ══ -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">

        <!-- ══ LEFT COLUMN: Invoice Content (Who/Where) ══ -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Business information -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">🏢 Business information</div>
                <div class="card-sub" style="color:var(--text3);margin-top:4px">
                  Appears at the top of every invoice — your legal identity
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Business / trading name</label>
                  <input class="form-input" id="set-biz-name" value="${u.businessName}" />
                </div>
                <div class="form-group">
                  <label class="form-label">ABN</label>
                  <input class="form-input" id="set-abn" value="${u.abn}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Entity type</label>
                  <select class="form-input" id="set-entity">
                    <option ${u.entityType==='Sole trader'?'selected':''}>Sole trader</option>
                    <option ${u.entityType==='Company'?'selected':''}>Company</option>
                    <option ${u.entityType==='Trust'?'selected':''}>Trust</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">GST registered</label>
                  <select class="form-input" id="set-gst">
                    <option value="yes" ${u.gstRegistered?'selected':''}>Yes — registered for GST</option>
                    <option value="no"  ${!u.gstRegistered?'selected':''}>No</option>
                  </select>
                  <div style="color:var(--text3);margin-top:4px">
                    Adds 10% GST to invoices automatically
                  </div>
                </div>
                <div class="form-group" style="grid-column:span 2">
                  <label class="form-label">Business address</label>
                  <input class="form-input" id="set-address" value="${u.address}" />
                </div>
              </div>
              <button class="btn btn-primary" style="margin-top:8px"
                onclick="SettingsActions.saveProfile()">Save profile</button>
            </div>
          </div>

          <!-- Contacts (Clients) -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">👥 Contacts</div>
                <div class="card-sub" style="color:var(--text3);margin-top:4px">
                  People and businesses you invoice regularly — who the invoice is TO
                </div>
              </div>
              <button class="btn btn-ghost btn-sm"
                onclick="SettingsActions.openContactForm(null)">+ Add contact</button>
            </div>
            <div id="settings-contacts-list">
              ${buildContactsList()}
            </div>
            <div id="settings-contact-form" style="display:none">
              <div class="card-body" style="border-top:1px solid var(--border)">
                ${buildContactForm()}
              </div>
            </div>
          </div>

          <!-- Payment accounts -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">💰 Payment accounts</div>
                <div class="card-sub" style="color:var(--text3);margin-top:4px">
                  Bank details that appear on invoices for client payment — where money gets SENT
                </div>
              </div>
              <button class="btn btn-ghost btn-sm"
                onclick="SettingsActions.openAccountForm(null)">+ Add account</button>
            </div>
            <div id="settings-accounts-list">
              ${buildAccountsList()}
            </div>
            <div id="settings-account-form" style="display:none"></div>
          </div>

          <!-- Notifications -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">🔔 Notifications</div>
                <div class="card-sub" style="color:var(--text3);margin-top:4px">
                  Email alerts you'll receive from the system
                </div>
              </div>
            </div>
            <div class="card-body" style="padding:12px 20px">
              ${UI.toggleRow({ title:'BAS due date reminders',     desc:'30, 14 and 3 days before each deadline',  on: n.basReminders,   id:'bas-rem'    })}
              ${UI.toggleRow({ title:'Annual return reminder',     desc:'Reminder from 1 July each year',          on: n.annualReminder, id:'annual-rem' })}
              ${UI.toggleRow({ title:'Overdue invoice alerts',     desc:'Email when invoice passes due date',      on: n.overdueAlerts,  id:'overdue'    })}
              ${UI.toggleRow({ title:'AI categorisation complete', desc:'Notify when uploaded docs are processed', on: n.aiComplete,     id:'ai-done'    })}
            </div>
          </div>

        </div>

        <!-- ══ RIGHT COLUMN: Invoice Rules (How) ══ -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Invoice defaults -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">📄 Invoice defaults</div>
                <div class="card-sub" style="color:var(--text3);margin-top:4px">
                  Controls invoice numbers, due dates, and currency for every new invoice
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Invoice number prefix</label>
                  <input class="form-input" id="set-inv-prefix"
                    value="${u.invoiceNumbering.format}"
                    placeholder="e.g. INV" />
                  <div style="color:var(--text3);margin-top:4px">
                    e.g., INV-2024-001
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Next invoice number</label>
                  <input class="form-input" id="set-inv-next" type="number"
                    value="${u.invoiceNumbering.nextNumber}" min="1" />
                </div>
                <div class="form-group">
                  <label class="form-label">Default payment terms</label>
                  <select class="form-input" id="set-inv-terms">
                    <option value="7">7 days</option>
                    <option value="14" selected>14 days</option>
                    <option value="21">21 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                  </select>
                  <div style="color:var(--text3);margin-top:4px">
                    Due date = issue date + X days
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Default currency</label>
                  <select class="form-input" id="set-inv-currency">
                    ${AppData.currencies.map(c =>
                      `<option value="${c.code}" ${c.code==='AUD'?'selected':''}>${c.code} — ${c.name}</option>`
                    ).join('')}
                  </select>
                </div>
                <div class="form-group" style="grid-column:span 2">
                  <label class="form-label">Default invoice notes</label>
                  <textarea class="form-input" id="set-inv-notes" rows="2"
                    placeholder="e.g. Thank you for your business"></textarea>
                </div>
                <div class="form-group" style="grid-column:span 2">
                  <label class="form-label">Default terms &amp; conditions</label>
                  <textarea class="form-input" id="set-inv-terms-text" rows="2"
                    placeholder="e.g. Payment due within the above period."></textarea>
                </div>
              </div>
              <button class="btn btn-primary" style="margin-top:8px"
                onclick="SettingsActions.saveInvoiceDefaults()">Save defaults</button>
            </div>
          </div>

          <!-- Service library (REDESIGNED - inline editing, no popups) -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">🛠️ Service library</div>
                <div class="card-sub" style="color:var(--text3);margin-top:4px">
                  Products/services you sell — add to invoices with one click
                </div>
              </div>
              <button class="btn btn-ghost btn-sm"
                onclick="SettingsActions.addCategoryInline()">+ Add category</button>
            </div>
            <div id="settings-services-list" style="padding:0 20px 16px">
              ${buildServicesListInline()}
            </div>
          </div>

          <!-- Branding -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">🎨 Branding</div>
                <div class="card-sub" style="color:var(--text3);margin-top:4px">
                  Your logo, colours, and footer message — how it looks
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="form-grid">
                <div class="form-group" style="grid-column:span 2">
                  <label class="form-label">Logo (PNG / SVG / JPG)</label>
                  <input type="file" accept="image/*" class="form-input" style="padding:6px"
                    onchange="SettingsActions.uploadLogo(this)" />
                  ${u.branding.logo ? `
                    <div style="margin-top:8px">
                      <img src="${u.branding.logo}"
                        style="max-height:48px;max-width:160px;object-fit:contain;
                          border:1px solid var(--border);border-radius:var(--radius-sm);padding:4px">
                    </div>` : ''}
                </div>
                <div class="form-group" style="grid-column:span 2">
                  <label class="form-label">Accent colour</label>
                  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                    ${['#008b8b','#0c8b69','#111827','#7c3aed','#b45309','#dfa41c'].map(color => `
                      <div onclick="SettingsActions.setAccentColor('${color}')"
                        style="width:28px;height:28px;border-radius:6px;background:${color};
                          cursor:pointer;border:${u.branding.accentColor===color
                            ?'2px solid var(--aqua)':'2px solid transparent'};
                          box-shadow:${u.branding.accentColor===color
                            ?'0 0 0 1px var(--brand)':'none'}"></div>
                    `).join('')}
                    <input type="color" id="set-accent-custom"
                      value="${u.branding.accentColor || '#008b8b'}"
                      style="width:28px;height:28px;border:none;border-radius:6px;
                        cursor:pointer;padding:0;background:none"
                      title="Custom colour"
                      onchange="SettingsActions.setAccentColor(this.value)" />
                    <span style="color:var(--text3)">Custom</span>
                  </div>
                </div>
                <div class="form-group" style="grid-column:span 2">
                  <label class="form-label">Invoice footer text</label>
                  <input class="form-input" id="set-footer-text"
                    placeholder="e.g. Thank you for your business"
                    value="${u.branding.footerText || ''}" />
                  <div style="color:var(--text3);margin-top:4px">
                    Appears at the bottom of every invoice. Leave blank to hide.
                  </div>
                </div>
              </div>
              <button class="btn btn-primary" style="margin-top:8px"
                onclick="SettingsActions.saveBranding()">Save branding</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════
   Contacts list + form builders
════════════════════════════════════════ */
function buildContactsList() {
  const contacts = AppData.user.contacts || [];
  if (contacts.length === 0) {
    return `<div class="card-body" style="padding:12px 20px">
      <div style="color:var(--text3)">No contacts added yet.</div>
    </div>`;
  }
  return contacts.map(c => `
    <div style="display:flex;align-items:center;justify-content:space-between;
      padding:12px 20px;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-weight:500;color:var(--text);display:flex;align-items:center;gap:8px">
          ${c.name}
          ${c.isDefault ? `<span class="badge badge-teal">Default</span>` : ''}
        </div>
        <div style="color:var(--text3);margin-top:2px">
          ${c.role ? c.role + ' · ' : ''}${c.email || ''}${c.phone ? ' · ' + c.phone : ''}
        </div>
      </div>
      <div style="display:flex;gap:6px">
        ${!c.isDefault ? `
          <button class="btn btn-ghost btn-sm"
            onclick="SettingsActions.setDefaultContact('${c.id}')">Set default</button>
        ` : ''}
        <button class="btn btn-ghost btn-sm"
          onclick="SettingsActions.openContactForm('${c.id}')">Edit</button>
      </div>
    </div>
  `).join('');
}

function buildContactForm(contactId) {
  const c = contactId
    ? (AppData.user.contacts || []).find(x => x.id === contactId)
    : null;
  return `
    <div style="font-weight:600;color:var(--text);margin-bottom:12px">
      ${c ? 'Edit contact' : 'Add contact'}
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Full name</label>
        <input class="form-input" id="cf-name" placeholder="e.g. Jane Davidson"
          value="${c ? c.name : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <input class="form-input" id="cf-role" placeholder="e.g. Director, Accounts"
          value="${c ? (c.role || '') : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="cf-email" type="email"
          placeholder="jane@business.com.au"
          value="${c ? (c.email || '') : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-input" id="cf-phone" placeholder="04XX XXX XXX"
          value="${c ? (c.phone || '') : ''}" />
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary"
        onclick="SettingsActions.saveContact('${contactId || ''}')">
        ${c ? 'Save changes' : 'Add contact'}
      </button>
      <button class="btn btn-ghost"
        onclick="SettingsActions.closeContactForm()">Cancel</button>
      ${c ? `<button class="btn btn-danger btn-sm" style="margin-left:auto"
        onclick="SettingsActions.deleteContact('${c.id}')">Delete</button>` : ''}
    </div>
  `;
}

/* ════════════════════════════════════════
   Payment accounts list + inline form builders
════════════════════════════════════════ */
/* ════════════════════════════════════════
   Payment accounts list + inline form builders
════════════════════════════════════════ */
function buildAccountsList() {
  const accounts = AppData.paymentAccounts || [];
  if (accounts.length === 0) {
    return `<div class="card-body" style="padding:12px 20px">
      <div style="color:var(--text3)">No payment accounts added yet.</div>
    </div>`;
  }
  return accounts.map(a => `
    <div class="payment-account" data-acc-id="${a.id}" style="border-bottom:1px solid var(--border); padding:12px 20px;">
      
      <!-- View mode -->
      <div id="acc-view-${a.id}" style="display:${SettingsState.editingAccountId === a.id ? 'none' : 'block'}">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:500; color:var(--text);">${escapeHtml(a.nickname)}</span>
            ${a.isDefault ? `<span class="badge badge-teal">Default</span>` : ''}
          </div>
          <div style="display:flex; gap:6px;">
            ${!a.isDefault ? `
              <button class="btn btn-ghost btn-sm"
                onclick="SettingsActions.setDefaultAccountInline('${a.id}')">Set default</button>
            ` : ''}
            <button class="btn btn-ghost btn-sm"
              onclick="SettingsActions.editAccountInline('${a.id}')">Edit</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--coral)"
              onclick="SettingsActions.deleteAccountInline('${a.id}')">Delete</button>
          </div>
        </div>
        <div style="margin-top:4px;">
          ${a.accountName ? `<div style="color:var(--text3); margin-bottom:2px;">${escapeHtml(a.accountName)}</div>` : ''}
          ${(a.bsb || a.accountNo) ? `<div style=" color:var(--text3); margin-bottom:2px;">${a.bsb ? `BSB: ${escapeHtml(a.bsb)}` : ''}${a.bsb && a.accountNo ? ' · ' : ''}${a.accountNo ? `Acc: ${escapeHtml(a.accountNo)}` : ''}</div>` : ''}
          ${a.payId ? `<div style="color:var(--text3);">PayID: ${escapeHtml(a.payId)}</div>` : ''}
        </div>
      </div>
      
      <!-- Edit mode (inline) -->
      <div id="acc-edit-${a.id}" style="display:${SettingsState.editingAccountId === a.id ? 'block' : 'none'}">
        <div class="form-grid" style="margin-top:8px;">
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Nickname</label>
            <input class="form-input" id="acc-nickname-${a.id}" value="${escapeHtml(a.nickname)}" placeholder="e.g. Main Business Account" />
            <div style="color:var(--text3); margin-top:4px;">
              What you call this account (appears on invoices)
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Account name</label>
            <input class="form-input" id="acc-name-${a.id}" value="${escapeHtml(a.accountName || '')}" placeholder="e.g. Jane Davidson" />
          </div>
          <div class="form-group">
            <label class="form-label">BSB</label>
            <input class="form-input" id="acc-bsb-${a.id}" value="${escapeHtml(a.bsb || '')}" placeholder="063-000" />
          </div>
          <div class="form-group">
            <label class="form-label">Account number</label>
            <input class="form-input" id="acc-number-${a.id}" value="${escapeHtml(a.accountNo || '')}" placeholder="1234 5678" />
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">PayID (optional)</label>
            <input class="form-input" id="acc-payid-${a.id}" value="${escapeHtml(a.payId || '')}" placeholder="0412 345 678" />
            <div style="color:var(--text3); margin-top:4px;">
              Phone number or email address for PayID payments
            </div>
          </div>
        </div>
        <div style="display:flex; gap:8px; margin-top:12px;">
          <button class="btn btn-primary btn-sm" onclick="SettingsActions.saveAccountInline('${a.id}')">Save changes</button>
          <button class="btn btn-ghost btn-sm" onclick="SettingsActions.cancelEditAccountInline('${a.id}')">Cancel</button>
          ${!a.isDefault ? `
            <button class="btn btn-ghost btn-sm" style="margin-left:auto"
              onclick="SettingsActions.setDefaultAccountInline('${a.id}')">Set as default</button>
          ` : ''}
        </div>
      </div>
      
    </div>
  `).join('');
}

/* ════════════════════════════════════════
   Service library builder (REDESIGNED - inline editing)
════════════════════════════════════════ */
function buildServicesListInline() {
  const categories = AppData.user.serviceCategories || [];
  if (categories.length === 0) {
    return `<div style="color:var(--text3);padding:12px 0">
      No service categories yet. Click "+ Add category" to get started.
    </div>`;
  }
  return categories.map(cat => `
    <div class="service-category" data-cat-id="${cat.id}" style="margin-top:16px; border-top: 1px solid var(--border); padding-top: 12px;">
      <!-- Category header with inline editing -->
      <div style="display:flex;align-items:center;justify-content:space-between; margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px; flex:1;">
          <div style="width:10px;height:10px;border-radius:50%; background:${cat.color || 'var(--brand)'}"></div>
          <div id="cat-name-display-${cat.id}" style="font-weight:normal;color:var(--text); cursor:pointer;" 
               onclick="SettingsActions.editCategoryNameInline('${cat.id}')">
            ${cat.name}
          </div>
          <input type="text" id="cat-name-input-${cat.id}" 
                 style="display:none; font-weight:normal; padding:4px 8px; border:1px solid var(--border); border-radius:var(--radius-sm);"
                 value="${cat.name}"
                 onblur="SettingsActions.saveCategoryNameInline('${cat.id}')"
                 onkeypress="if(event.key==='Enter') this.blur()" />
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm"
            onclick="SettingsActions.addServiceItemInline('${cat.id}')">+ Item</button>
          <button class="btn btn-ghost btn-sm"
            onclick="SettingsActions.deleteCategoryInline('${cat.id}')"
            style="color:var(--coral)">✕ Delete</button>
        </div>
      </div>

      <!-- Items table -->
      <div id="cat-items-${cat.id}" style="margin-left:18px;">
        <div style="display:grid; grid-template-columns: 1fr 100px 100px 120px 40px; gap:8px; margin-bottom:8px;color:var(--text3); padding:0 4px;">
          <div>Description</div>
          <div>Ref code</div>
          <div>Price ($)</div>
          <div>Unit</div>
          <div></div>
        </div>
        ${(cat.items || []).map((item, idx) => `
          <div id="svc-item-${cat.id}-${idx}" class="service-item-row"
               style="display:grid; grid-template-columns:1fr 100px 100px 120px 40px; gap:8px; align-items:center; margin-bottom:6px;">
            <input class="form-input" placeholder="e.g. Lawn mowing"
              style="padding:6px 10px"
              value="${escapeHtml(item.description || '')}"
              oninput="SettingsActions.updateServiceItem('${cat.id}',${idx},'description',this.value)" />
            <input class="form-input" placeholder="e.g. LM01"
              style="padding:6px 10px"
              value="${escapeHtml(item.refCode || '')}"
              oninput="SettingsActions.updateServiceItem('${cat.id}',${idx},'refCode',this.value)" />
            <input class="form-input" placeholder="0.00" type="number" step="0.01" min="0"
              style="padding:6px 10px"
              value="${item.price || ''}"
              oninput="SettingsActions.updateServiceItem('${cat.id}',${idx},'price',this.value)" />
            <div style="display:flex; gap:4px; position:relative;">
              <select class="form-input" 
                style="padding:6px 8px; flex:1; cursor:pointer;"
                onchange="if(this.value === '__custom__') { 
                  this.style.display = 'none'; 
                  this.nextElementSibling.style.display = 'block'; 
                  this.nextElementSibling.focus(); 
                } else {
                  SettingsActions.updateServiceItem('${cat.id}',${idx},'unit',this.value);
                }"
                id="unit-select-${cat.id}-${idx}">
                <option value="unit" ${item.unit === 'unit' ? 'selected' : ''}>unit</option>
                <option value="hour" ${item.unit === 'hour' ? 'selected' : ''}>hour</option>
                <option value="job" ${item.unit === 'job' ? 'selected' : ''}>job</option>
                <option value="day" ${item.unit === 'day' ? 'selected' : ''}>day</option>
                <option value="m²" ${item.unit === 'm²' ? 'selected' : ''}>m²</option>
                <option value="session" ${item.unit === 'session' ? 'selected' : ''}>session</option>
                <option value="visit" ${item.unit === 'visit' ? 'selected' : ''}>visit</option>
                <option value="month" ${item.unit === 'month' ? 'selected' : ''}>month</option>
                <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>kg</option>
                <option value="per person" ${item.unit === 'per person' ? 'selected' : ''}>per person</option>
                <option value="__custom__">Custom...</option>
              </select>
              <input type="text" 
                class="form-input" 
                placeholder="Enter custom unit"
                style="padding:6px 8px; flex:1; display:none;"
                id="unit-custom-${cat.id}-${idx}"
                value="${escapeHtml(['hr','job','unit','day','m²','session','visit','month','kg','per person'].includes(item.unit) ? '' : item.unit)}"
                onblur="
                  if(this.value.trim()) {
                    SettingsActions.updateServiceItem('${cat.id}',${idx},'unit',this.value.trim());
                    const select = this.previousElementSibling;
                    select.style.display = 'block';
                    this.style.display = 'none';
                    select.value = this.value.trim();
                    const optionExists = Array.from(select.options).some(opt => opt.value === this.value.trim());
                    if(!optionExists && this.value.trim()) {
                      const newOption = document.createElement('option');
                      newOption.value = this.value.trim();
                      newOption.textContent = this.value.trim();
                      select.add(newOption, select.options[select.options.length - 1]);
                    }
                    select.value = this.value.trim();
                  } else {
                    this.style.display = 'none';
                    this.previousElementSibling.style.display = 'block';
                  }
                "
                onkeypress="if(event.key === 'Enter') this.blur()" />
            </div>
            <button class="btn btn-ghost btn-sm"
              style="color:var(--coral); padding:4px 6px;"
              onclick="SettingsActions.deleteServiceItem('${cat.id}',${idx})">✕</button>
          </div>
        `).join('')}
        ${(!cat.items || cat.items.length === 0) ? `
          <div style="color:var(--text3); padding:12px 4px;">
            No items yet — click "+ Item" to add products or services
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// Helper function to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

/* ════════════════════════════════════════
   Settings actions
════════════════════════════════════════ */
var SettingsActions = {


     /* ── Font size ── */
  setFontSize: function(size) {
    AppData.user.fontSize = size;
    const html = document.documentElement;
    if (size === 'small') {
      html.style.fontSize = '13px';
    } else if (size === 'medium') {
      html.style.fontSize = '15px';
    } else if (size === 'large') {
      html.style.fontSize = '17px';
    }
    // Update active button styles
    document.querySelectorAll('.font-size-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('onclick')?.includes(size)) {
        btn.classList.add('active');
      }
    });
    this.toast(`Font size changed to ${size}`);
    },

  /* ── Profile ── */
  saveProfile: function() {
    AppData.user.businessName = document.getElementById('set-biz-name')?.value.trim() || AppData.user.businessName;
    AppData.user.abn          = document.getElementById('set-abn')?.value.trim()      || AppData.user.abn;
    AppData.user.entityType   = document.getElementById('set-entity')?.value          || AppData.user.entityType;
    AppData.user.gstRegistered= document.getElementById('set-gst')?.value === 'yes';
    AppData.user.address      = document.getElementById('set-address')?.value.trim()  || AppData.user.address;
    this.toast('Profile saved ✓');
  },

  /* ── Branding ── */
  uploadLogo: function(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { AppData.user.branding.logo = e.target.result; this.toast('Logo uploaded ✓'); };
    reader.readAsDataURL(file);
  },

  setAccentColor: function(color) {
    AppData.user.branding.accentColor = color;
    if (typeof InvoiceState !== 'undefined') InvoiceState.accentColor = color;
    document.documentElement.style.setProperty('--accent', color);
    this.toast('Accent colour updated ✓');
  },

  saveBranding: function() {
    AppData.user.branding.footerText = document.getElementById('set-footer-text')?.value || '';
    this.toast('Branding saved ✓');
  },

  /* ── Invoice defaults ── */
  saveInvoiceDefaults: function() {
    AppData.user.invoiceNumbering.format     = document.getElementById('set-inv-prefix')?.value.trim() || 'INV';
    AppData.user.invoiceNumbering.nextNumber = parseInt(document.getElementById('set-inv-next')?.value) || 1;
    const terms = document.getElementById('set-inv-terms')?.value;
    if (terms) AppData.user.defaultPaymentTerms = parseInt(terms);
    const currency = document.getElementById('set-inv-currency')?.value;
    if (currency) AppData.user.defaultCurrency = currency;
    const notes = document.getElementById('set-inv-notes')?.value;
    if (notes !== undefined) AppData.user.defaultInvoiceNotes = notes;
    const termsText = document.getElementById('set-inv-terms-text')?.value;
    if (termsText !== undefined) AppData.user.defaultTermsConditions = termsText;
    this.toast('Invoice defaults saved ✓');
  },

  /* ── Contacts ── */
  openContactForm: function(contactId) {
    SettingsState.editingContactId = contactId;
    const form = document.getElementById('settings-contact-form');
    if (!form) return;
    const body = form.querySelector('.card-body');
    if (body) body.innerHTML = buildContactForm(contactId);
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  closeContactForm: function() {
    const form = document.getElementById('settings-contact-form');
    if (form) form.style.display = 'none';
    SettingsState.editingContactId = null;
  },

  saveContact: function(contactId) {
    if (!AppData.user.contacts) AppData.user.contacts = [];
    const name  = document.getElementById('cf-name')?.value.trim()  || '';
    const role  = document.getElementById('cf-role')?.value.trim()  || '';
    const email = document.getElementById('cf-email')?.value.trim() || '';
    const phone = document.getElementById('cf-phone')?.value.trim() || '';
    if (!name) { alert('Name is required.'); return; }

    if (contactId) {
      const c = AppData.user.contacts.find(x => x.id === contactId);
      if (c) { c.name = name; c.role = role; c.email = email; c.phone = phone; }
    } else {
      const isFirst = AppData.user.contacts.length === 0;
      AppData.user.contacts.push({
        id: 'con-' + Date.now(), name, role, email, phone, isDefault: isFirst
      });
    }
    this.closeContactForm();
    this.refreshContactsList();
    this.toast('Contact saved ✓');
  },

  deleteContact: function(contactId) {
    if (!confirm('Delete this contact?')) return;
    AppData.user.contacts = (AppData.user.contacts || []).filter(c => c.id !== contactId);
    this.closeContactForm();
    this.refreshContactsList();
    this.toast('Contact deleted ✓');
  },

  setDefaultContact: function(contactId) {
    (AppData.user.contacts || []).forEach(c => { c.isDefault = c.id === contactId; });
    this.refreshContactsList();
    this.toast('Default contact updated ✓');
  },

  refreshContactsList: function() {
    const list = document.getElementById('settings-contacts-list');
    if (list) list.innerHTML = buildContactsList();
  },

  /* ── Payment accounts (inline editing - NO POPUPS) ── */
  
  editAccountInline: function(accountId) {
    // Close any other open edit forms first
    if (SettingsState.editingAccountId) {
      this.cancelEditAccountInline(SettingsState.editingAccountId);
    }
    SettingsState.editingAccountId = accountId;
    this.refreshAccountsList();
    // Focus the first input after refresh
    setTimeout(() => {
      const firstInput = document.querySelector(`#acc-edit-${accountId} .form-input`);
      if (firstInput) firstInput.focus();
    }, 100);
  },

  cancelEditAccountInline: function(accountId) {
    if (SettingsState.editingAccountId === accountId) {
      SettingsState.editingAccountId = null;
      this.refreshAccountsList();
    }
  },

  saveAccountInline: function(accountId) {
    const a = AppData.paymentAccounts.find(x => x.id === accountId);
    if (a) {
      const newNickname = document.getElementById(`acc-nickname-${accountId}`)?.value.trim();
      if (!newNickname) {
        alert('Nickname is required.');
        return;
      }
      a.nickname = newNickname;
      a.accountName = document.getElementById(`acc-name-${accountId}`)?.value.trim() || '';
      a.bsb = document.getElementById(`acc-bsb-${accountId}`)?.value.trim() || '';
      a.accountNo = document.getElementById(`acc-number-${accountId}`)?.value.trim() || '';
      a.payId = document.getElementById(`acc-payid-${accountId}`)?.value.trim() || '';
    }
    SettingsState.editingAccountId = null;
    this.refreshAccountsList();
    this.toast('Account saved ✓');
  },

  deleteAccountInline: function(accountId) {
    if (!confirm('Delete this account?')) return;
    AppData.paymentAccounts = AppData.paymentAccounts.filter(a => a.id !== accountId);
    if (SettingsState.editingAccountId === accountId) {
      SettingsState.editingAccountId = null;
    }
    this.refreshAccountsList();
    this.toast('Account deleted ✓');
  },

  setDefaultAccountInline: function(accountId) {
    AppData.paymentAccounts.forEach(a => { a.isDefault = a.id === accountId; });
    this.refreshAccountsList();
    this.toast('Default account updated ✓');
  },

  // For adding NEW accounts (uses the form at the bottom)
  openAccountForm: function(accountId) {
    if (accountId === null) {
      // Adding new account - show the form
      const form = document.getElementById('settings-account-form');
      if (!form) return;
      form.innerHTML = this.buildNewAccountForm();
      form.style.display = 'block';
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      // Editing existing - use inline
      this.editAccountInline(accountId);
    }
  },

  closeAccountForm: function() {
    const form = document.getElementById('settings-account-form');
    if (form) form.style.display = 'none';
  },

  buildNewAccountForm: function() {
    return `
      <div class="card-body" style="border-top:1px solid var(--border)">
        <div style="font-weight:600;color:var(--text);margin-bottom:12px">
          Add new account
        </div>
        <div class="form-grid">
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Nickname</label>
            <input class="form-input" id="af-nickname" placeholder="e.g. Main Business Account" />
            <div style="color:var(--text3);margin-top:4px">
              What you call this account (appears on invoices)
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Account name</label>
            <input class="form-input" id="af-account-name" placeholder="e.g. Jane Davidson" />
          </div>
          <div class="form-group">
            <label class="form-label">BSB</label>
            <input class="form-input" id="af-bsb" placeholder="063-000" />
          </div>
          <div class="form-group">
            <label class="form-label">Account number</label>
            <input class="form-input" id="af-account-no" placeholder="1234 5678" />
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">PayID (optional)</label>
            <input class="form-input" id="af-payid" placeholder="0412 345 678" />
            <div style="color:var(--text3);margin-top:4px">
              Phone number or email address for PayID payments
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-primary" onclick="SettingsActions.saveNewAccount()">Add account</button>
          <button class="btn btn-ghost" onclick="SettingsActions.closeAccountForm()">Cancel</button>
        </div>
      </div>
    `;
  },

  saveNewAccount: function() {
    const nickname = document.getElementById('af-nickname')?.value.trim() || '';
    const accountName = document.getElementById('af-account-name')?.value.trim() || '';
    const bsb = document.getElementById('af-bsb')?.value.trim() || '';
    const accountNo = document.getElementById('af-account-no')?.value.trim() || '';
    const payId = document.getElementById('af-payid')?.value.trim() || '';
    
    if (!nickname) { alert('Nickname is required.'); return; }
    
    const isFirst = AppData.paymentAccounts.length === 0;
    AppData.paymentAccounts.push({
      id: 'acc-' + Date.now(), 
      nickname, 
      accountName, 
      bsb, 
      accountNo, 
      payId, 
      isDefault: isFirst
    });
    this.closeAccountForm();
    this.refreshAccountsList();
    this.toast('Account added ✓');
  },

  refreshAccountsList: function() {
    const list = document.getElementById('settings-accounts-list');
    if (list) list.innerHTML = buildAccountsList();
  },

  /* ── Service categories (REDESIGNED - inline, no popups) ── */
  addCategoryInline: function() {
    if (!AppData.user.serviceCategories) AppData.user.serviceCategories = [];
    const colors = ['#008b8b','#0c8b69','#1e40af','#7c3aed','#b45309','#dfa41c'];
    const color  = colors[AppData.user.serviceCategories.length % colors.length];
    const newCategory = {
      id:    'cat-' + Date.now(),
      name:  'New category',
      color: color,
      items: []
    };
    AppData.user.serviceCategories.push(newCategory);
    this.refreshServicesList();
    // Auto-enter edit mode for the new category
    setTimeout(() => {
      this.editCategoryNameInline(newCategory.id);
    }, 100);
  },

  editCategoryNameInline: function(catId) {
    const displaySpan = document.getElementById(`cat-name-display-${catId}`);
    const inputField = document.getElementById(`cat-name-input-${catId}`);
    if (displaySpan && inputField) {
      displaySpan.style.display = 'none';
      inputField.style.display = 'inline-block';
      inputField.focus();
      inputField.select();
    }
  },

  saveCategoryNameInline: function(catId) {
    const displaySpan = document.getElementById(`cat-name-display-${catId}`);
    const inputField = document.getElementById(`cat-name-input-${catId}`);
    if (displaySpan && inputField) {
      const newName = inputField.value.trim();
      if (newName) {
        const cat = (AppData.user.serviceCategories || []).find(c => c.id === catId);
        if (cat) cat.name = newName;
        displaySpan.textContent = newName;
      }
      displaySpan.style.display = 'flex';
      inputField.style.display = 'none';
      this.refreshServicesList();
    }
  },

  deleteCategoryInline: function(catId) {
    if (!confirm('Delete this category and all its items?')) return;
    AppData.user.serviceCategories = (AppData.user.serviceCategories || [])
      .filter(c => c.id !== catId);
    this.refreshServicesList();
    this.toast('Category deleted ✓');
  },

  addServiceItemInline: function(catId) {
    const cat = (AppData.user.serviceCategories || []).find(c => c.id === catId);
    if (!cat) return;
    if (!cat.items) cat.items = [];
    cat.items.push({ description: '', refCode: '', price: 0, unit: 'unit' });
    this.refreshServicesList();
    // Scroll to the new item
    setTimeout(() => {
      const itemsContainer = document.getElementById(`cat-items-${catId}`);
      if (itemsContainer) {
        itemsContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  },

  updateServiceItem: function(catId, idx, field, value) {
    const cat = (AppData.user.serviceCategories || []).find(c => c.id === catId);
    if (!cat || !cat.items[idx]) return;
    if (field === 'price') {
      cat.items[idx][field] = parseFloat(value) || 0;
    } else {
      cat.items[idx][field] = value;
    }
    // Auto-save: show subtle indicator instead of full toast
    this.showAutoSaveIndicator();
  },

  deleteServiceItem: function(catId, idx) {
    const cat = (AppData.user.serviceCategories || []).find(c => c.id === catId);
    if (!cat) return;
    cat.items.splice(idx, 1);
    this.refreshServicesList();
    this.toast('Item removed ✓');
  },

  refreshServicesList: function() {
    const list = document.getElementById('settings-services-list');
    if (list) list.innerHTML = buildServicesListInline();
  },

  /* ── Auto-save indicator ── */
  showAutoSaveIndicator: function() {
    let el = document.getElementById('autosave-indicator');
    if (!el) {
      el = document.createElement('div');
      el.id = 'autosave-indicator';
      el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
        background:var(--surface);border:1px solid var(--border);
        border-radius:var(--radius-sm);padding:6px 12px;
        color:var(--text3);z-index:9999;transition:opacity 0.2s;
        pointer-events:none;`;
      document.body.appendChild(el);
    }
    el.textContent = '✓ Auto-saved';
    el.style.opacity = '1';
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.style.opacity = '0'; }, 1500);
  },

  /* ── Toast notification ── */
  toast: function(msg) {
    let el = document.getElementById('settings-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'settings-toast';
      el.style.cssText = `position:fixed;bottom:24px;right:24px;background:var(--surface);
        border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 16px;
        color:var(--green);box-shadow:0 4px 16px rgba(0,0,0,0.15);
        z-index:9999;transition:opacity 0.3s`;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.style.opacity = '0'; }, 2500);
  }

};

/* ── Init ── */
function initSettings() {
  // Ensure data structures exist
  if (!AppData.user.contacts)          AppData.user.contacts = [];
  if (!AppData.user.serviceCategories) AppData.user.serviceCategories = [];
  if (!AppData.user.branding)          AppData.user.branding = { logo: null, accentColor: '#008b8b', footerText: '' };
  if (!AppData.user.defaultPaymentTerms) AppData.user.defaultPaymentTerms = 14;
  if (!AppData.user.defaultCurrency)   AppData.user.defaultCurrency = 'AUD';
  if (!AppData.user.defaultInvoiceNotes) AppData.user.defaultInvoiceNotes = '';
  if (!AppData.user.defaultTermsConditions) AppData.user.defaultTermsConditions = '';
  
  // Set user accent color to --accent (NOT --brand)
  // This only affects invoices, BAS reports, and annual reports
  if (AppData.user.branding.accentColor) {
    document.documentElement.style.setProperty('--accent', AppData.user.branding.accentColor);
  }
  
  /* ── Load saved font size ── */
  if (AppData.user.fontSize) {
    SettingsActions.setFontSize(AppData.user.fontSize);
  } else {
    // Default to medium if not set
    AppData.user.fontSize = 'medium';
    SettingsActions.setFontSize('medium');
  }
}