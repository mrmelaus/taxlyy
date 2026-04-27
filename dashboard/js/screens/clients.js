/* ─────────────────────────────────────────
   js/screens/clients.js
   Clients screen — list, add, edit, detail
   Service items per client
───────────────────────────────────────── */

/* ── Client state ── */
var ClientState = {
  activeFilter:  'all',
  expandedId:    null,
  editingId:     null,
  panelOpen:     false,
};

/* ── Build the clients screen shell ── */
function buildClients() {
  return `
    <div class="screen" id="screen-clients">

      <!-- Page header -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <div>
          <div style="font-weight:600;color:var(--text)">Clients</div>
          <div style="color:var(--text3);margin-top:4px" id="clients-count">
            ${AppData.clients.length} saved clients
          </div>
        </div>
        <button class="btn btn-primary" onclick="ClientPanel.open(null)" style="padding:10px 20px">
          + Add client
        </button>
      </div>

      <!-- Filter pills -->
      <div class="cat-pills" style="margin-bottom:24px">
        <div class="cat-pill active" data-client-filter="all"
          onclick="ClientList.filter('all', this)">All</div>
        <div class="cat-pill" data-client-filter="recent"
          onclick="ClientList.filter('recent', this)">Recent</div>
        <div class="cat-pill" data-client-filter="high-value"
          onclick="ClientList.filter('high-value', this)">High value</div>
      </div>

      <!-- Two-column layout: list + panel -->
      <div style="display:grid;grid-template-columns:1fr;gap:20px;align-items:start"
        id="clients-layout">

        <!-- Client list -->
        <div class="card" id="clients-table-wrap">
          <table class="table" id="clients-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ABN</th>
                <th>Contact</th>
                <th>Total invoiced</th>
                <th>Last invoice</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="clients-tbody"></tbody>
          </table>
        </div>

        <!-- Right-side panel (hidden by default) -->
        <div id="client-panel" style="display:none"></div>

      </div>
    </div>
  `;
}

/* ════════════════════════════════════════
   ClientList — renders and filters rows
════════════════════════════════════════ */
var ClientList = {

  getFiltered: function (filter) {
    var all = AppData.clients;
    if (filter === 'recent') {
      return all.slice().sort(function (a, b) {
        return new Date(b.lastInvoice) - new Date(a.lastInvoice);
      });
    }
    if (filter === 'high-value') {
      return all.slice().sort(function (a, b) {
        return b.totalInvoiced - a.totalInvoiced;
      });
    }
    return all;
  },

  render: function () {
    var tbody = document.getElementById('clients-tbody');
    if (!tbody) return;
    var clients = this.getFiltered(ClientState.activeFilter);

    if (clients.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <div class="empty-title">No clients yet</div>
            <div class="empty-sub">Click "+ Add client" to get started</div>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = clients.map(function (c) {
      var isExpanded = ClientState.expandedId === c.id;
      return `
        <tr class="client-row ${isExpanded ? 'client-row-active' : ''}"
          id="client-row-${c.id}" style="cursor:pointer"
          onclick="ClientList.toggleExpand('${c.id}')">
          <td>
            <div style="display:flex;align-items:center;gap:12px">
             <div style="width:40px;height:40px;border-radius:50%;background:var(--brand);
                display:flex;align-items:center;justify-content:center;
                font-weight:600;color:#fff;flex-shrink:0">
                ${c.name.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style="font-weight:600;color:var(--text);">${c.name}</div>
                ${c.notes ? `<div style="color:var(--text3);margin-top:2px">${c.notes}</div>` : ''}
              </div>
            </div>
          </td>
          <td style="font-weight:500;">${c.abn || '—'}</td>
          <td>
            <div style="color:var(--text2)">${c.phone || '—'}</div>
            <div style="color:var(--text3);margin-top:2px">${c.email || ''}</div>
          </td>
          <td><span class="amount income" style=";font-weight:600">$${(c.totalInvoiced||0).toLocaleString()}</span></td>
          <td style="color:var(--text3)">${c.lastInvoice || '—'}</td>
          <td onclick="event.stopPropagation()">
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost btn-sm" style="padding:6px 12px;"
                onclick="ClientPanel.open('${c.id}')">Edit</button>
              <button class="btn btn-primary btn-sm" style="padding:6px 12px;"
                onclick="ClientList.newInvoice('${c.id}')">Invoice</button>
            </div>
          </td>
        </tr>
        ${isExpanded ? ClientList.expandedRow(c) : ''}
      `;
    }).join('');
  },

  expandedRow: function (c) {
    var services = (c.serviceOverrides || []);
    return `
      <tr id="client-expanded-${c.id}">
        <td colspan="6" style="padding:0;background:var(--surface2)">
          <div style="padding:24px 28px;display:grid;grid-template-columns:repeat(3,1fr);gap:28px">

            <div>
              <div style="font-weight:600;text-transform:uppercase;
                letter-spacing:0.08em;color:var(--text3);margin-bottom:12px">Contact</div>
              <div style="color:var(--text2);line-height:1.8">
                <div>${c.address || '—'}</div>
                <div>${c.email || '—'}</div>
                <div>${c.phone || '—'}</div>
              </div>
            </div>

            <div>
              <div style="font-weight:600;text-transform:uppercase;
                letter-spacing:0.08em;color:var(--text3);margin-bottom:12px">Invoice defaults</div>
              <div style="color:var(--text2);line-height:1.8">
                <div>Terms: <strong>${c.defaultTermsDays || 14} days</strong></div>
                <div>Prefix: <strong>${c.invoicePrefix || 'INV'}</strong></div>
              </div>
            </div>

            <div>
              <div style="font-weight:600;text-transform:uppercase;
                letter-spacing:0.08em;color:var(--text3);margin-bottom:12px">Service items</div>
              ${services.length > 0
                ? services.map(function(s) {
                    return `<div style="color:var(--text2);margin-bottom:8px">
                      <span style="var(--brand);font-weight:500">${s.refCode}</span>
                      — ${s.description}
                      <span style="color:var(--text3);margin-left:4px">$${s.price}/${s.unit}</span>
                    </div>`;
                  }).join('')
                : `<div style="color:var(--text3)">No service items set</div>`
              }
            </div>

          </div>
        </td>
      </tr>
    `;
  },

  toggleExpand: function (clientId) {
    ClientState.expandedId = ClientState.expandedId === clientId ? null : clientId;
    this.render();
  },

  filter: function (filter, pillEl) {
    ClientState.activeFilter = filter;
    document.querySelectorAll('[data-client-filter]').forEach(function (p) {
      p.classList.remove('active');
    });
    if (pillEl) pillEl.classList.add('active');
    this.render();
  },

  newInvoice: function (clientId) {
    var client = AppData.clients.find(function(c){ return c.id === clientId; });
    if (client && typeof applyClient === 'function') {
      Router.go('new-invoice');
      setTimeout(function() { applyClient(clientId); }, 100);
    }
  }

};

/* ════════════════════════════════════════
   ClientPanel — add / edit right-side panel
════════════════════════════════════════ */
var ClientPanel = {

  open: function (clientId) {
    ClientState.editingId = clientId;
    ClientState.panelOpen = true;

    var client = clientId
      ? AppData.clients.find(function(c){ return c.id === clientId; })
      : null;

    var panel = document.getElementById('client-panel');
    if (!panel) return;

    // Show panel and switch to two-column layout
    panel.style.display = 'block';
    var layout = document.getElementById('clients-layout');
    if (layout) layout.style.gridTemplateColumns = '1fr 560px';

    var services = (client && client.serviceOverrides) ? client.serviceOverrides : [];
    var serviceRows = services.map(function(s, i) {
      return ClientPanel.serviceRow(i, s);
    }).join('');

    panel.innerHTML = `
      <div class="card" style="position:sticky;top:24px;overflow:hidden">
        <div class="card-header">
          <div class="card-title">
            ${client ? 'Edit client' : 'Add client'}
          </div>
          <button class="btn btn-ghost" onclick="ClientPanel.close()">Close ✕</button>
        </div>
        <div style="max-height:calc(100vh - 180px);overflow-y:auto;padding:20px">

          <!-- ABN Lookup -->
          <div style="margin-bottom:24px">
            <label class="form-label" style="font-weight:600;margin-bottom:10px;display:block">
              ABN Lookup
            </label>
            <div id="client-abn-lookup"></div>
          </div>

          <!-- Business name -->
          <div style="margin-bottom:16px">
            <div class="form-group">
              <label class="form-label">Business / company name *</label>
              <input class="form-input" id="cp-name"
                placeholder="e.g. Acme Corp Pty Ltd"
                style="padding:10px 14px;width:100%"
                value="${client ? this.escapeHtml(client.name) : ''}" />
            </div>
          </div>

          <!-- ABN + Email -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
            <div class="form-group">
              <label class="form-label">ABN</label>
              <input class="form-input" id="cp-abn" placeholder="XX XXX XXX XXX"
                style="padding:10px 14px;width:100%"
                value="${client ? this.escapeHtml(client.abn || '') : ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" id="cp-email" type="email"
                placeholder="example@taxlyy.com.au"
                style="padding:10px 14px;width:100%"
                value="${client ? this.escapeHtml(client.email || '') : ''}" />
            </div>
          </div>

          <!-- Address -->
          <div style="margin-bottom:16px">
            <div class="form-group">
              <label class="form-label">Address *</label>
              <input class="form-input" id="cp-address"
                placeholder="Start typing address..."
                style="padding:10px 14px;width:100%"
                value="${client ? this.escapeHtml(client.address || '') : ''}" />
            </div>
          </div>

          <!-- Contact + Phone -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
            <div class="form-group">
              <label class="form-label">Primary contact</label>
              <input class="form-input" id="cp-contact" placeholder="e.g. John Smith"
                style="padding:10px 14px;width:100%"
                value="${client ? this.escapeHtml(client.contactName || '') : ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" id="cp-phone" placeholder="04XX XXX XXX"
                style="padding:10px 14px;width:100%"
                value="${client ? this.escapeHtml(client.phone || '') : ''}" />
            </div>
          </div>

          <!-- Terms + Prefix -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
            <div class="form-group">
              <label class="form-label">Default payment terms</label>
              <select class="form-input" id="cp-terms"
                style="padding:10px 14px;width:100%">
                <option value="7"  ${(client&&client.defaultTermsDays===7)  ?'selected':''}>7 days</option>
                <option value="14" ${(!client||client.defaultTermsDays===14)?'selected':''}>14 days</option>
                <option value="21" ${(client&&client.defaultTermsDays===21) ?'selected':''}>21 days</option>
                <option value="30" ${(client&&client.defaultTermsDays===30) ?'selected':''}>30 days</option>
                <option value="60" ${(client&&client.defaultTermsDays===60) ?'selected':''}>60 days</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Invoice prefix</label>
              <input class="form-input" id="cp-prefix" placeholder="e.g. ACM"
                style="padding:10px 14px;width:100%"
                value="${client ? this.escapeHtml(client.invoicePrefix || '') : ''}" />
            </div>
          </div>

          <!-- Notes -->
          <div style="margin-bottom:24px">
            <label class="form-label">Notes (optional)</label>
            <textarea class="form-input" id="cp-notes" rows="3"
              placeholder="e.g. PO number required"
              style="padding:10px 14px;min-height:80px;resize:vertical;width:100%"
              >${client ? this.escapeHtml(client.notes || '') : ''}</textarea>
          </div>

          <!-- Service items -->
          <div style="margin-top:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
              <div style="font-weight:600;text-transform:uppercase;
                letter-spacing:0.08em;color:var(--text3)">Client service items</div>
              <button class="btn btn-ghost btn-sm" style="padding:6px 12px"
                onclick="ClientPanel.addServiceRow()">+ Add item</button>
            </div>
            <div id="cp-services" style="display:flex;flex-direction:column;gap:10px">
              ${serviceRows || `<div style="color:var(--text3);padding:12px 0;text-align:center"
                id="cp-no-services">No service items yet — click "+ Add item" to add</div>`}
            </div>
          </div>

          <!-- Save / Delete -->
          <div style="display:flex;gap:12px;margin-top:24px;padding-top:20px;
            border-top:1px solid var(--border)">
            <button class="btn btn-primary"
              style="flex:1;justify-content:center;padding:10px 14px;font-weight:600"
              onclick="ClientPanel.save()">
              ${client ? 'Save changes' : 'Add client'}
            </button>
            ${client ? `
              <button class="btn btn-danger"
                style="padding:10px 20px"
                onclick="ClientPanel.delete('${client.id}')">Delete</button>
            ` : ''}
          </div>

        </div>
      </div>
    `;

    // Init ABN lookup
    setTimeout(function() {
      var container = document.getElementById('client-abn-lookup');
      if (container && typeof ABNLookup !== 'undefined') {
        var ui = ABNLookup.createSearchUI({
          placeholder: 'Search ABN or business name...',
          onSuccess: function(data) {
            var nameEl    = document.getElementById('cp-name');
            var abnEl     = document.getElementById('cp-abn');
            var addressEl = document.getElementById('cp-address');
            if (nameEl    && data.legalName)                    nameEl.value    = data.legalName;
            if (abnEl     && data.abnFormatted)                 abnEl.value     = data.abnFormatted;
            if (addressEl && data.address && data.address.full) addressEl.value = data.address.full;
          }
        });
        container.appendChild(ui);
      }
      ClientPanel.setupAddressAutocomplete();
    }, 50);
  },

  serviceRow: function (index, s) {
  s = s || {};

    // Build options from all service categories
    var allItems = [];
    (AppData.user.serviceCategories || []).forEach(function(cat) {
      (cat.items || []).forEach(function(item) {
        allItems.push(item);
      });
    });

    var descOptions = '<option value="">— Pick from library or type custom —</option>' +
      allItems.map(function(item) {
        return `<option value="${ClientPanel.escapeHtml(item.description)}"
          data-refcode="${ClientPanel.escapeHtml(item.refCode || '')}"
          data-price="${item.price || ''}"
          data-unit="${ClientPanel.escapeHtml(item.unit || 'unit')}">
          ${ClientPanel.escapeHtml(item.description)}
        </option>`;
      }).join('') +
      '<option value="__custom__">Custom...</option>';

    var isCustomDesc = s.description && !allItems.some(function(i) {
      return i.description === s.description;
    });

    return `
      <div class="cp-service-row" id="cp-service-${index}"
        style="display:grid;grid-template-columns:1fr 120px 100px 80px 36px;
          gap:8px;align-items:center;margin-bottom:4px">

        <!-- Description — always-on dropdown + custom input -->
        <div style="display:flex;flex-direction:column;gap:4px">
          <select class="form-input" style="padding:8px 10px"
            id="cp-desc-select-${index}"
            onchange="ClientPanel.onDescriptionSelect(${index}, this.value)">
            ${descOptions}
          </select>
          <input class="form-input" placeholder="Type custom description..."
            style="padding:8px 10px;display:${isCustomDesc ? 'block' : 'none'}"
            id="cp-desc-custom-${index}"
            value="${isCustomDesc ? ClientPanel.escapeHtml(s.description || '') : ''}"
            data-field="description" />
        </div>

        <!-- Ref code -->
        <input class="form-input" placeholder="Ref code"
          style="padding:8px 10px;font-family:var(--mono)"
          value="${ClientPanel.escapeHtml(s.refCode || '')}"
          id="cp-refcode-${index}"
          data-field="refCode" />

        <!-- Price -->
        <input class="form-input" placeholder="Price $" type="number" min="0" step="0.01"
          style="padding:8px 10px"
          value="${s.price || ''}"
          id="cp-price-${index}"
          data-field="price" />

        <!-- Unit — always-on dropdown + custom -->
        <div style="display:flex;flex-direction:column;gap:4px">
          <select class="form-input" style="padding:8px 6px"
            id="cp-unit-select-${index}"
            data-field="unit"
            onchange="ClientPanel.onUnitSelect(${index}, this.value)">
            <option value="unit"       ${s.unit==='unit'      ?'selected':''}>unit</option>
            <option value="hour"       ${s.unit==='hour'      ?'selected':''}>hour</option>
            <option value="hr"         ${s.unit==='hr'        ?'selected':''}>hr</option>
            <option value="job"        ${s.unit==='job'       ?'selected':''}>job</option>
            <option value="day"        ${s.unit==='day'       ?'selected':''}>day</option>
            <option value="m²"         ${s.unit==='m²'        ?'selected':''}>m²</option>
            <option value="session"    ${s.unit==='session'   ?'selected':''}>session</option>
            <option value="visit"      ${s.unit==='visit'     ?'selected':''}>visit</option>
            <option value="month"      ${s.unit==='month'     ?'selected':''}>month</option>
            <option value="kg"         ${s.unit==='kg'        ?'selected':''}>kg</option>
            <option value="per person" ${s.unit==='per person'?'selected':''}>per person</option>
            <option value="__custom__">Custom...</option>
          </select>
          <input class="form-input" placeholder="Custom unit..."
            style="padding:8px 6px;display:none"
            id="cp-unit-custom-${index}" />
        </div>

        <button class="btn btn-ghost btn-sm"
          style="color:var(--coral);padding:6px;align-self:start;margin-top:2px"
          onclick="ClientPanel.removeServiceRow(${index})">✕</button>
      </div>
    `;
  },

onDescriptionSelect: function(index, value) {
    var customInput = document.getElementById('cp-desc-custom-' + index);
    if (value === '__custom__') {
      // Show custom text input
      if (customInput) {
        customInput.style.display = 'block';
        customInput.focus();
        customInput.setAttribute('data-field', 'description');
      }
      return;
    }
    // Hide custom input
    if (customInput) customInput.style.display = 'none';

    if (!value) return;

    // Find matching library item and auto-fill
    var allItems = [];
    (AppData.user.serviceCategories || []).forEach(function(cat) {
      (cat.items || []).forEach(function(item) { allItems.push(item); });
    });
    var match = allItems.find(function(item) { return item.description === value; });
    if (match) {
      var refInput   = document.getElementById('cp-refcode-' + index);
      var priceInput = document.getElementById('cp-price-'   + index);
      var unitSelect = document.getElementById('cp-unit-select-' + index);
      if (refInput)   refInput.value   = match.refCode || '';
      if (priceInput) priceInput.value = match.price   || '';
      if (unitSelect) {
        var found = Array.from(unitSelect.options).some(function(opt) {
          if (opt.value === match.unit) { unitSelect.value = match.unit; return true; }
          return false;
        });
        if (!found && match.unit) {
          // Add custom unit option
          var opt = document.createElement('option');
          opt.value = match.unit;
          opt.textContent = match.unit;
          unitSelect.add(opt, unitSelect.options[unitSelect.options.length - 1]);
          unitSelect.value = match.unit;
        }
      }
    }
  },

onUnitSelect: function(index, value) {
    var customInput = document.getElementById('cp-unit-custom-' + index);
    var unitSelect  = document.getElementById('cp-unit-select-' + index);
    if (value === '__custom__') {
      if (customInput) {
        customInput.style.display = 'block';
        customInput.focus();
        customInput.onblur = function() {
          var custom = customInput.value.trim();
          if (custom) {
            // Add to select and select it
            var exists = Array.from(unitSelect.options).some(function(o) { return o.value === custom; });
            if (!exists) {
              var opt = document.createElement('option');
              opt.value = custom;
              opt.textContent = custom;
              unitSelect.add(opt, unitSelect.options[unitSelect.options.length - 1]);
            }
            unitSelect.value = custom;
          } else {
            unitSelect.value = 'unit';
          }
          customInput.style.display = 'none';
        };
        customInput.onkeydown = function(e) {
          if (e.key === 'Enter') customInput.blur();
        };
      }
    }
  },

  addServiceRow: function () {
    var container = document.getElementById('cp-services');
    if (!container) return;
    var placeholder = document.getElementById('cp-no-services');
    if (placeholder) placeholder.remove();
    var index = container.querySelectorAll('.cp-service-row').length;
    var div = document.createElement('div');
    div.innerHTML = this.serviceRow(index, {});
    container.appendChild(div.firstElementChild);
  },

  removeServiceRow: function (index) {
    var row = document.getElementById('cp-service-' + index);
    if (row) row.remove();
    var container = document.getElementById('cp-services');
    if (container && container.querySelectorAll('.cp-service-row').length === 0) {
      container.innerHTML = `<div style="color:var(--text3);padding:12px 0;text-align:center"
        id="cp-no-services">No service items yet — click "+ Add item" to add</div>`;
    }
  },

  getServiceRows: function () {
    var rows = document.querySelectorAll('.cp-service-row');
    var services = [];
    rows.forEach(function(row, i) {
      var descSelect  = row.querySelector('select[id^="cp-desc-select"]');
      var descCustom  = row.querySelector('input[id^="cp-desc-custom"]');
      var refInput    = row.querySelector('input[data-field="refCode"]');
      var priceInput  = row.querySelector('input[data-field="price"]');
      var unitSelect  = row.querySelector('select[id^="cp-unit-select"]');
      var unitCustom  = row.querySelector('input[id^="cp-unit-custom"]');

      var description = (descSelect && descSelect.value && descSelect.value !== '__custom__')
        ? descSelect.value
        : (descCustom ? descCustom.value.trim() : '');

      var unit = (unitSelect && unitSelect.value && unitSelect.value !== '__custom__')
        ? unitSelect.value
        : (unitCustom ? unitCustom.value.trim() || 'unit' : 'unit');

      var refCode = refInput  ? refInput.value.trim()            : '';
      var price   = priceInput? parseFloat(priceInput.value) || 0 : 0;

      if (description || refCode) {
        services.push({ description, refCode, price, unit });
      }
    });
    return services;
  },

  setupAddressAutocomplete: function() {
    var addressInput = document.getElementById('cp-address');
    if (!addressInput) return;

    var existingWrapper = addressInput.closest('.address-wrapper');
    if (existingWrapper) {
      var parent = existingWrapper.parentNode;
      parent.insertBefore(addressInput, existingWrapper);
      parent.removeChild(existingWrapper);
    }

    var parent = addressInput.parentNode;
    var wrapper = document.createElement('div');
    wrapper.className = 'address-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.width = '100%';
    parent.insertBefore(wrapper, addressInput);
    wrapper.appendChild(addressInput);

    var suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'address-suggestions';
    suggestionsDiv.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:12px;max-height:200px;overflow-y:auto;z-index:1001;display:none;margin-top:4px;box-shadow:0 4px 12px rgba(0,0,0,0.1)';
    wrapper.appendChild(suggestionsDiv);

    var debounceTimer;

    function formatAustralianAddress(addr) {
      var parts = [];
      var streetParts = [];
      if (addr.address.house_number) streetParts.push(addr.address.house_number);
      if (addr.address.road) streetParts.push(addr.address.road);
      else if (addr.address.street) streetParts.push(addr.address.street);
      if (streetParts.length > 0) parts.push(streetParts.join(' '));
      var suburb = addr.address.suburb || addr.address.city_district || addr.address.town || addr.address.city;
      if (suburb) parts.push(suburb);
      var state = '';
      if (addr.address.state) {
        var stateMap = {
          'New South Wales': 'NSW', 'Victoria': 'VIC', 'Queensland': 'QLD',
          'South Australia': 'SA',  'Western Australia': 'WA', 'Tasmania': 'TAS',
          'Northern Territory': 'NT', 'Australian Capital Territory': 'ACT'
        };
        state = stateMap[addr.address.state] || addr.address.state;
        if (state) parts.push(state);
      }
      if (addr.address.postcode) parts.push(addr.address.postcode);
      return parts.join(' ');
    }

    addressInput.addEventListener('input', function(e) {
      clearTimeout(debounceTimer);
      var query = e.target.value.trim();
      if (query.length < 3) {
        suggestionsDiv.style.display = 'none';
        suggestionsDiv.innerHTML = '';
        return;
      }
      debounceTimer = setTimeout(function() {
        suggestionsDiv.style.display = 'block';
        suggestionsDiv.innerHTML = '<div style="padding:10px 14px;color:var(--text3)">Searching addresses...</div>';
        var url = 'https://nominatim.openstreetmap.org/search?' +
                  'q=' + encodeURIComponent(query + ', Australia') +
                  '&format=json&limit=5&addressdetails=1&countrycodes=au&dedupe=1';
        fetch(url, { headers: { 'User-Agent': 'Taxlyy Invoice App (https://taxlyy.com.au)' } })
          .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
          .then(function(data) {
            if (data && data.length > 0) {
              suggestionsDiv.innerHTML = data.map(function(addr) {
                var cleanAddress = formatAustralianAddress(addr);
                if (cleanAddress.split(' ').length < 3) {
                  cleanAddress = addr.display_name.split(',')[0] + ', ' +
                    (addr.address.suburb || addr.address.city || '') + ' ' +
                    (addr.address.state || '') + ' ' +
                    (addr.address.postcode || '');
                }
                return '<div class="suggestion-item" data-address="' +
                  ClientPanel.escapeHtml(cleanAddress) +
                  '" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border)">' +
                  ClientPanel.escapeHtml(cleanAddress) + '</div>';
              }).join('');
              suggestionsDiv.querySelectorAll('.suggestion-item').forEach(function(el) {
                el.addEventListener('click', function() {
                  addressInput.value = this.getAttribute('data-address');
                  suggestionsDiv.style.display = 'none';
                  suggestionsDiv.innerHTML = '';
                });
              });
            } else {
              suggestionsDiv.innerHTML = '<div style="padding:10px 14px;color:var(--text3)">No addresses found. Please enter manually.</div>';
            }
          })
          .catch(function() {
            suggestionsDiv.innerHTML = '<div style="padding:10px 14px;color:var(--coral)">Search unavailable. Please enter manually.</div>';
          });
      }, 500);
    });

    document.addEventListener('click', function(e) {
      if (!wrapper.contains(e.target)) suggestionsDiv.style.display = 'none';
    });

    addressInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && suggestionsDiv.style.display === 'block') {
        var first = suggestionsDiv.querySelector('.suggestion-item');
        if (first) {
          e.preventDefault();
          addressInput.value = first.getAttribute('data-address');
          suggestionsDiv.style.display = 'none';
          suggestionsDiv.innerHTML = '';
        }
      }
    });
  },

  save: function () {
    var name    = (document.getElementById('cp-name')?.value    || '').trim();
    var abn     = (document.getElementById('cp-abn')?.value     || '').trim();
    var contact = (document.getElementById('cp-contact')?.value || '').trim();
    var email   = (document.getElementById('cp-email')?.value   || '').trim();
    var phone   = (document.getElementById('cp-phone')?.value   || '').trim();
    var address = (document.getElementById('cp-address')?.value || '').trim();
    var terms   = parseInt(document.getElementById('cp-terms')?.value  || 14);
    var prefix  = (document.getElementById('cp-prefix')?.value  || '').trim();
    var notes   = (document.getElementById('cp-notes')?.value   || '').trim();
    var services = this.getServiceRows();

    if (!name)    { alert('Business name is required.');                    return; }
    if (!address) { alert('Address is required — needed for invoices.');    return; }

    // Offer to save new custom services to library
  services.forEach(function(svc) {
    if (!svc.description) return;
    var allItems = [];
    (AppData.user.serviceCategories || []).forEach(function(cat) {
      (cat.items || []).forEach(function(item) { allItems.push(item); });
    });
    var exists = allItems.some(function(item) {
      return item.description === svc.description;
    });
    if (!exists && confirm('"' + svc.description + '" is not in your service library. Save it for future use?')) {
      if (!AppData.user.serviceCategories) AppData.user.serviceCategories = [];
      if (AppData.user.serviceCategories.length === 0) {
        AppData.user.serviceCategories.push({ id:'cat-default', name:'General', color:'#008b8b', items:[] });
      }
      AppData.user.serviceCategories[0].items.push({
        id:          'si-' + Date.now(),
        description: svc.description,
        refCode:     svc.refCode || '',
        price:       svc.price   || 0,
        unit:        svc.unit    || 'unit'
      });
    }
  });

    if (ClientState.editingId) {
      var client = AppData.clients.find(function(c){ return c.id === ClientState.editingId; });
      if (client) {
        client.name             = name;
        client.abn              = abn;
        client.contactName      = contact;
        client.email            = email;
        client.phone            = phone;
        client.address          = address;
        client.defaultTermsDays = terms;
        client.invoicePrefix    = prefix;
        client.notes            = notes;
        client.serviceOverrides = services;
      }
    } else {
      var newClient = {
        id:               'cl-' + Date.now(),
        name:             name,
        abn:              abn,
        contactName:      contact,
        email:            email,
        phone:            phone,
        address:          address,
        defaultTermsDays: terms,
        defaultAccountId: AppData.paymentAccounts.find(function(a){ return a.isDefault; })?.id || '',
        invoicePrefix:    prefix || (typeof AppData.derivePrefix === 'function'
                            ? AppData.derivePrefix(name)
                            : name.substring(0,3).toUpperCase()),
        notes:            notes,
        serviceOverrides: services,
        totalInvoiced:    0,
        lastInvoice:      '—',
      };
      AppData.clients.unshift(newClient);
    }

    var countEl = document.getElementById('clients-count');
    if (countEl) countEl.textContent = AppData.clients.length + ' saved clients';

    this.close();
    ClientList.render();
  },

  delete: function (clientId) {
    if (!confirm('Delete this client? This cannot be undone.')) return;
    AppData.clients = AppData.clients.filter(function(c){ return c.id !== clientId; });
    var countEl = document.getElementById('clients-count');
    if (countEl) countEl.textContent = AppData.clients.length + ' saved clients';
    this.close();
    ClientList.render();
  },

  close: function () {
    ClientState.panelOpen = false;
    ClientState.editingId = null;
    var panel = document.getElementById('client-panel');
    if (panel) panel.style.display = 'none';
    var layout = document.getElementById('clients-layout');
    if (layout) layout.style.gridTemplateColumns = '1fr';
  },

  escapeHtml: function (str) {
    if (!str) return '';
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

};

/* ── Init clients screen when navigated to ── */
function initClients() {
  ClientState.expandedId   = null;
  ClientState.panelOpen    = false;
  ClientState.activeFilter = 'all';
  ClientList.render();
}