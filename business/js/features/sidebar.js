/* ─────────────────────────────────────────
   sidebar.js
   Sidebar expand / collapse control
   Modes: expanded | collapsed | hover
───────────────────────────────────────── */

var Sidebar = (function () {

  var sidebar      = null;
  var menu         = null;
  var btn          = null;
  var menuVisible  = false;
  var currentMode  = 'expanded';
  var hoverTimeout = null;

  var MODES = ['expanded', 'collapsed', 'hover'];

  /* ── Apply a mode ── */
  function applyMode(mode) {
    if (!sidebar) return;

    sidebar.classList.remove('sidebar-collapsed', 'sidebar-hover');

    if (mode === 'collapsed') {
      sidebar.classList.add('sidebar-collapsed');
    } else if (mode === 'hover') {
      sidebar.classList.add('sidebar-collapsed', 'sidebar-hover');
    }

    // Update check marks in menu
    MODES.forEach(function (m) {
      var el = document.getElementById('check-' + m);
      if (el) el.textContent = m === mode ? '●' : '';
    });

    currentMode = mode;
  }

  /* ── Public: set mode and save ── */
  function set(mode) {
    applyMode(mode);
    try { localStorage.setItem('taxlyy-sidebar', mode); } catch (e) {}
    hideMenu();
  }

  /* ── Menu visibility ── */
  function showMenu() {
    if (!menu) return;
    menu.classList.add('visible');
    menuVisible = true;
  }

  function hideMenu() {
    if (!menu) return;
    menu.classList.remove('visible');
    menuVisible = false;
  }

  /* ── Hover expand (only active in hover mode) ── */
  function onMouseEnter() {
    if (currentMode !== 'hover') return;
    clearTimeout(hoverTimeout);
    sidebar.classList.remove('sidebar-collapsed');
  }

  function onMouseLeave() {
    if (currentMode !== 'hover') return;
    // Don't collapse if menu is open
    if (menuVisible) return;
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(function () {
      sidebar.classList.add('sidebar-collapsed');
    }, 200);
  }

  /* ── Init ── */
  function init() {
    sidebar = document.getElementById('sidebar');
    menu    = document.getElementById('collapse-menu');
    btn     = document.getElementById('collapse-toggle');

    if (!sidebar || !menu || !btn) return;

    // Restore saved mode
    var saved = 'expanded';
    try { saved = localStorage.getItem('taxlyy-sidebar') || 'expanded'; } catch (e) {}
    applyMode(saved);

    // Toggle button click
    btn.addEventListener('click', function (e) {
      e.stopPropagation();

      // If currently collapsed (not hover), single click expands directly
      if (currentMode === 'collapsed') {
        set('expanded');
        return;
      }

      // Otherwise show/hide the mode menu
      menuVisible ? hideMenu() : showMenu();
    });

    // Click outside closes menu
    document.addEventListener('click', function (e) {
      if (!menuVisible) return;
      if (menu.contains(e.target)) return;
      if (e.target === btn || btn.contains(e.target)) return;
      hideMenu();
    });

    // Hover expand/collapse
    sidebar.addEventListener('mouseenter', onMouseEnter);
    sidebar.addEventListener('mouseleave', onMouseLeave);
  }

  /* ── Auto-init ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { set: set, init: init };

})();