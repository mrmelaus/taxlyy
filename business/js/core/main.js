/* ─────────────────────────────────────────
   main.js — App bootstrap
   Safe build: each screen wrapped in
   try/catch so one error never kills nav.
───────────────────────────────────────── */

(function init() {

  const content = document.getElementById('content');
  if (!content) { console.error('Taxlyy: #content not found'); return; }

  /* ── 1. Build each screen safely ── */
  const builders = [
    ['dashboard',    buildDashboard],
    ['invoices',     buildInvoices],
    ['new-invoice',  buildNewInvoice],
    ['clients',      buildClients],
    ['expenses',     buildExpenses],
    ['documents',    buildDocuments],
    ['bas',          buildBas],
    ['annual',       buildAnnual],
    ['depreciation', buildDepreciation],
    ['settings',     buildSettings],
  ];

  let html = '';
  for (const [id, fn] of builders) {
    try {
      html += fn();
    } catch (err) {
      console.error('Taxlyy: error building screen "' + id + '":', err);
      html += '<div class="screen" id="screen-' + id + '">'
            + '<div style="padding:40px;color:var(--coral);">'
            + 'Screen &quot;' + id + '&quot; failed to build — check console.'
            + '</div></div>';
    }
  }
  content.innerHTML = html;

  /* ── 2. Wire sidebar nav ── */
  document.querySelectorAll('.nav-item[data-screen]').forEach(function(item) {
    item.addEventListener('click', function() {
      Router.go(item.dataset.screen);
    });
  });

  /* ── 3. Header buttons ── */
  var basBtnEl = document.getElementById('header-bas-btn');
  if (basBtnEl) basBtnEl.addEventListener('click', function() { Router.go('bas'); });

  var newInvBtnEl = document.getElementById('header-new-invoice-btn');
  if (newInvBtnEl) newInvBtnEl.addEventListener('click', function() { Router.go('new-invoice'); });

  /* ── 4. Category pill filter (delegated) ── */
  document.addEventListener('click', function(e) {
    var pill = e.target.closest('.cat-pill');
    if (!pill) return;
    var group = pill.closest('.cat-pills');
    if (!group) return;
    group.querySelectorAll('.cat-pill').forEach(function(p) { p.classList.remove('active'); });
    pill.classList.add('active');

    var filter = pill.dataset.filter;
    if (filter) {
      var tbody = document.getElementById('invoices-tbody');
      if (tbody) {
        tbody.innerHTML = (filter === 'all'
          ? AppData.invoices
          : AppData.invoices.filter(function(i) { return i.status === filter; })
        ).map(function(inv) { return UI.invoiceRow(inv); }).join('');
      }
    }
  });

  /* ── 5. Toggle switches (delegated) ── */
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('toggle')) {
      e.target.classList.toggle('on');
    }
  });

  /* ── 6. Start router — always runs last ── */
  Router.init();

  /* ── 7. Init invoice builder one tick later ──
      Ensures DOM is settled and router has set
      the active screen before we touch elements  */
  setTimeout(function() {
    try {
      initNewInvoice();
      
      // Initialize settings
      if (typeof initSettings === 'function') initSettings();
      
      // Initialize preview after new invoice screen is ready
      // Check if new-invoice screen exists and is active
      var newInvoiceScreen = document.getElementById('screen-new-invoice');
      if (newInvoiceScreen && typeof InvoicePreview !== 'undefined') {
        InvoicePreview.init('invoice-preview-container');
      }
    } catch (err) {
      console.error('Taxlyy: initNewInvoice() failed:', err);
    }
  }, 0);

})();