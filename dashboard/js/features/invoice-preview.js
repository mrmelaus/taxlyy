/* ─────────────────────────────────────────
   invoice-preview.js
   Live A4 preview — auto-fit scaling
───────────────────────────────────────── */

var InvoicePreview = (function () {

  var previewContent  = null;   // #a4-preview-content
  var updateTimeout   = null;
  var resizeObserver  = null;
  var isExpanded      = false;

  /* ── Auto-fit: scale A4 to fill wrapper width ── */
function fitToWrapper() {
  var a4El = previewContent ? previewContent.querySelector('.a4-preview') : null;
  var wrapper = previewContent ? previewContent.closest('.a4-preview-wrapper') : null;
  if (!a4El || !wrapper) return;
  
  var wrapperWidth = wrapper.clientWidth - 40;
  var a4NaturalWidth = 794;
  var scale = wrapperWidth / a4NaturalWidth;
  scale = Math.max(0.35, Math.min(scale, 0.9));
  
  console.log('Scale applied:', scale); // Add this to see the scale value
  
  a4El.style.transform = 'scale(' + scale + ')';
  a4El.style.transformOrigin = 'top center';
}

  /* ── Debounced preview update ── */
  function updatePreview() {
    if (!previewContent) return;
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(function () {
      var html = window.buildPrintHtml ? window.buildPrintHtml() : '';
      if (previewContent) {
        // Wrap the HTML in an A4 container JUST LIKE the expand modal
        previewContent.innerHTML = '<div class="a4-preview">' + html + '</div>';
        fitToWrapper();
      }
    }, 100);
  }
  
   /* ── Expand modal ── */
  function expandPreview() {
    var modal = document.getElementById('preview-expand-modal');
    if (!modal) return;
  
    var modalBody = modal.querySelector('.preview-modal-body');
    if (modalBody) {
      var html = window.buildPrintHtml ? window.buildPrintHtml() : '';
      modalBody.innerHTML = '<div class="a4-preview">' + html + '</div>';
    }
  
    modal.classList.add('active');
    isExpanded = true;
  }
 

  function closeExpand() {
    var modal = document.getElementById('preview-expand-modal');
    if (modal) modal.classList.remove('active');
    isExpanded = false;
  }

  /* ── Init ── */
  function init(containerId) {
    var container = document.getElementById(containerId || 'invoice-preview-container');
    if (!container) {
      console.warn('InvoicePreview: container not found');
      return;
    }

    container.innerHTML = `
      <div class="preview-panel">

        <div class="preview-header">
          <div class="preview-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="2" width="12" height="12" rx="1"/>
              <line x1="5" y1="5" x2="11" y2="5"/>
              <line x1="5" y1="8" x2="11" y2="8"/>
              <line x1="5" y1="11" x2="8"  y2="11"/>
            </svg>
            Live A4 Preview
          </div>
          <div class="preview-actions">
            <button class="btn btn-ghost btn-sm" id="preview-expand-btn" title="Full screen preview">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
                stroke="currentColor" stroke-width="1.5">
                <polyline points="5 2 2 2 2 5"/>
                <polyline points="11 2 14 2 14 5"/>
                <polyline points="5 14 2 14 2 11"/>
                <polyline points="11 14 14 14 14 11"/>
                <line x1="2"  y1="2"  x2="6"  y2="6"/>
                <line x1="14" y1="2"  x2="10" y2="6"/>
                <line x1="2"  y1="14" x2="6"  y2="10"/>
                <line x1="14" y1="14" x2="10" y2="10"/>
              </svg>
              Expand
            </button>
          </div>
        </div>

        <div class="a4-preview-wrapper">
          <div id="a4-preview-content"></div>
        </div>

        <div class="preview-footer">
          ⚡ Updates as you type &nbsp;·&nbsp; Click to expand full screen
        </div>

      </div>

      <!-- Expand modal -->
      <div id="preview-expand-modal" class="preview-modal"
        onclick="if(event.target===this)InvoicePreview.closeExpand()">
        <div class="preview-modal-content">
          <div class="preview-modal-header">
            <div style="font-weight:600;font-size:14px;color:#111">Invoice Preview</div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary" onclick="downloadInvoicePdf()" style="font-size:12px">Download PDF</button>
              <button class="preview-modal-close" onclick="InvoicePreview.closeExpand()">✕</button>
            </div>
          </div>
          <div class="preview-modal-body"></div>
        </div>
      </div>
    `;

    previewContent = document.getElementById('a4-preview-content');

    /* Expand button */
    var expandBtn = document.getElementById('preview-expand-btn');
    if (expandBtn) expandBtn.addEventListener('click', expandPreview);

    /* Click on preview to expand */
    if (previewContent) {
      previewContent.addEventListener('click', expandPreview);
    }

    /* ResizeObserver — refit whenever the panel resizes */
    var wrapper = container.querySelector('.a4-preview-wrapper');
    if (wrapper && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(function () {
        fitToWrapper();
      });
      resizeObserver.observe(wrapper);
    }

    /* Debounced window resize — handles browser window resizing and zoom changes */
    var resizeTimeout;
    window.addEventListener('resize', function() {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        fitToWrapper();
      }, 100);
    });

  }
  function refresh() {
    updatePreview();
  }

  return {
    init:          init,
    refresh:       refresh,
    expandPreview: expandPreview,
    closeExpand:   closeExpand
  };

})();