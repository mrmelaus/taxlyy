/* ─────────────────────────────────────────
   router.js — Screen navigation
───────────────────────────────────────── */

var Router = (() => {

  /* Titles are a function — evaluated lazily when go() is called,
     NOT at parse time. This prevents "AppData is not defined" errors
     when router.js loads before AppData is fully initialised.       */
  function getTitle(id) {
    var fy = (typeof AppData !== 'undefined' && AppData.summary)
      ? AppData.summary.fy : '2024-25';
    var map = {
      'dashboard':    'Dashboard <span class="page-subtitle">FY ' + fy + '</span>',
      'invoices':     'Invoices',
      'new-invoice':  'New invoice',
      'clients':      'Clients',
      'expenses':     'Expenses',
      'documents':    'Documents',
      'bas':          'BAS report \u2014 Q3 2025',
      'annual':       'Annual report',
      'depreciation': 'Depreciation schedule',
      'settings':     'Settings',
    };
    return map[id] || id;
  }

  var current = null;
function go(id) {
  /* Hide all screens — remove active class AND force hide */
  document.querySelectorAll('.screen').forEach(function(el) {
    el.classList.remove('active');
    el.style.display = 'none';  // ← Force hide every screen
  });

  /* Deactivate all nav items */
  document.querySelectorAll('.nav-item').forEach(function(el) {
    el.classList.remove('active');
  });

  /* Show target screen */
  var screen = document.getElementById('screen-' + id);
  if (screen) {
    screen.classList.add('active');
    screen.style.display = 'block';  // ← Force show only this screen
    screen.style.removeProperty('display'); // Optional: remove inline to let CSS take over
  } else {
    console.warn('Router: screen #screen-' + id + ' not found');
    return;
  }

  /* Activate matching nav item */
  var navItem = document.querySelector('.nav-item[data-screen="' + id + '"]');
  if (navItem) navItem.classList.add('active');

  /* Update header title */
  var titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.innerHTML = getTitle(id);

  current = id;

  /* Per-screen init hooks (keep your existing ones) */
  if (id === 'new-invoice') {
    setTimeout(function() {
      try {
        initNewInvoice();
      } catch(e) {
        console.error('initNewInvoice error:', e);
      }
    }, 0);
  }
  
  if (id === 'settings') {
    setTimeout(function() {
      if (typeof initSettings === 'function') {
        try {
          initSettings();
        } catch(e) {
          console.error('initSettings error:', e);
        }
      }
    }, 0);
  }

  if (id === 'expenses') {
    setTimeout(function() {
      try {
        attachEventListeners();
      } catch(e) {
        console.error('attachEventListeners error:', e);
      }
    }, 0);
  }

  if (id === 'documents') {
    setTimeout(function() {
      if (typeof Documents !== 'undefined' && Documents.init) {
        try {
          Documents.init();
        } catch(e) {
          console.error('Documents.init error:', e);
        }
      }
    }, 0);
  }

  /* Browser history */
  if (window.history && window.history.pushState) {
    window.history.pushState({ screen: id }, '', '#' + id);
  }
}

  /* Browser back/forward */
  window.addEventListener('popstate', function(e) {
    var id = (e.state && e.state.screen) ? e.state.screen : 'dashboard';
    go(id);
  });

  function init() {
    var hash = window.location.hash.replace('#', '');
    go(hash || 'dashboard');
  }

  return {
    go: go,
    init: init,
    get current() { return current; }
  };

})();