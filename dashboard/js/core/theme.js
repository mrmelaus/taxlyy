/* ─────────────────────────────────────────
   theme.js — Theme switcher
   Modes: 'auto' | 'light' | 'dark'
   Default: 'auto' (follows OS)
   Persisted in localStorage
───────────────────────────────────────── */

var Theme = (function() {

  var STORAGE_KEY = 'taxlyy-theme';
  var current     = 'auto';
  var mediaQuery  = window.matchMedia('(prefers-color-scheme: dark)');

  /* Read saved preference or default to auto */
  function load() {
    return localStorage.getItem(STORAGE_KEY) || 'auto';
  }

  /* Apply theme to <html> element */
  function apply(mode) {
    var html = document.documentElement;

    if (mode === 'auto') {
      /* Remove explicit attribute — CSS @media handles it */
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', mode);
    }

    /* Update toggle button states */
    document.querySelectorAll('.theme-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.theme === mode);
    });

    current = mode;
  }

  /* Set mode, save, apply */
  function set(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
    apply(mode);
  }

  /* Listen for OS theme change when in auto mode */
  mediaQuery.addEventListener('change', function() {
    if (current === 'auto') {
      apply('auto');
    }
  });

  /* Init on load */
  function init() {
    apply(load());
  }

  return {
    init:    init,
    set:     set,
    get current() { return current; }
  };

})();

/* Init immediately — runs before DOM renders
   to avoid flash of wrong theme             */
Theme.init();
