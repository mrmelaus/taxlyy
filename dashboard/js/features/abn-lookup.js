/* ─────────────────────────────────────────
   abn-lookup.js  –  ABR API Integration
   Uses the official ABN Lookup JSON service
   (https://abr.business.gov.au/json/)
   ─────────────────────────────────────────
   JSON endpoints (no CORS proxy required):
     ABN  → https://abr.business.gov.au/json/AbnDetails.aspx
              ?abn=<11 digits>&guid=<GUID>&callback=<fn>
     Name → https://abr.business.gov.au/json/MatchingNames.aspx
              ?name=<string>&guid=<GUID>&callback=<fn>

   Fallback (XML via proxy) if JSON fails:
     https://abr.business.gov.au/ABRXMLSearch/AbrXmlSearch.asmx/
       SearchByABNv202001
         ?searchString=<11 digits>
         &includeHistoricalDetails=N
         &authenticationGuid=<GUID>
─────────────────────────────────────────── */

var ABNLookup = (function () {

  const GUID = '23c0784b-47a8-49d1-b247-c70e1c8de9fc';

  // ── JSON base URLs (no proxy needed – ABR supports JSONP/CORS) ──
  const JSON_BASE  = 'https://abr.business.gov.au/json/';
  // ── XML HTTP-GET fallback (still needs a CORS proxy) ──
  const XML_BASE   = 'https://abr.business.gov.au/ABRXMLSearch/AbrXmlSearch.asmx/';
  const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

  /* ════════════════════════════════════════
     Helpers
  ════════════════════════════════════════ */

  /** Strip every non-digit character (handles "12 345 678 901", "12-345-678-901", etc.) */
  function digitsOnly(str) {
    return (str || '').replace(/\D/g, '');
  }

  /** Format 11-digit string → "XX XXX XXX XXX" */
  function formatABN(abn) {
    const d = digitsOnly(abn);
    if (d.length !== 11) return abn || '';
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  }

  /** Validate ABN checksum (saves a network round-trip for obvious typos) */
  function isValidABN(abn) {
    const d = digitsOnly(abn);
    if (d.length !== 11) return false;
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const digits  = d.split('').map(Number);
    digits[0] -= 1;
    const sum = digits.reduce((acc, n, i) => acc + n * weights[i], 0);
    return sum % 89 === 0;
  }

  function escapeHtml(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  /* ════════════════════════════════════════
     Animated "Searching…" dots
     Uses setInterval so it keeps ticking
     even while awaiting network responses.
  ════════════════════════════════════════ */

  let _dotsTimer = null;

  function startDotsAnimation(el) {
    if (!el) return;
    stopDotsAnimation(el); // clear any existing timer on this element first
    let count = 0;
    const base = el.textContent.replace(/\.+$/, '');
    el.dataset.baseText = base;
    el.textContent = base;
    el._dotsTimer = setInterval(() => {
      count = (count + 1) % 4;
      el.textContent = base + '.'.repeat(count);
    }, 400);
  }

  function stopDotsAnimation(el) {
    if (!el) return;
    if (el._dotsTimer) { clearInterval(el._dotsTimer); el._dotsTimer = null; }
    if (el.dataset.baseText !== undefined) {
      el.textContent = el.dataset.baseText;
      delete el.dataset.baseText;
    }
  }

  function setLoading(btn, statusEl, loading) {
    if (loading) {
      if (btn) {
        btn.disabled = true;
        btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
        btn.textContent = 'Searching';
        startDotsAnimation(btn);
      }
      if (statusEl) {
        statusEl.textContent = 'Searching ABR database';
        statusEl.style.color = 'var(--text3)';
        startDotsAnimation(statusEl);
      }
    } else {
      if (btn) {
        stopDotsAnimation(btn);
        btn.textContent = btn.dataset.originalText || 'Search & fill →';
        btn.disabled = false;
      }
      if (statusEl) {
        stopDotsAnimation(statusEl);
      }
    }
  }

  /* ════════════════════════════════════════
     JSONP helper  (ABR JSON service returns
     a JSONP-wrapped response when a callback
     name is supplied)
  ════════════════════════════════════════ */

  function jsonpFetch(url) {
    return new Promise((resolve, reject) => {
      const cbName = '_abrCb_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
      const script  = document.createElement('script');
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP timeout'));
      }, 12000);

      function cleanup() {
        clearTimeout(timeout);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cbName] = function (data) {
        cleanup();
        resolve(data);
      };

      script.src = url + '&callback=' + cbName;
      script.onerror = () => { cleanup(); reject(new Error('JSONP script error')); };
      document.head.appendChild(script);
    });
  }

  /* ════════════════════════════════════════
     Search by ABN  –  JSON endpoint first,
     XML endpoint as fallback
  ════════════════════════════════════════ */

  async function searchByABN(rawAbn) {
    const abn = digitsOnly(rawAbn);

    // Client-side checksum check before hitting the network
    if (!isValidABN(abn)) {
      return { success: false, error: 'Invalid ABN – please check the number and try again' };
    }

    /* ── 1. Try the JSON service (JSONP, no proxy needed) ── */
    try {
      const url  = `${JSON_BASE}AbnDetails.aspx?abn=${abn}&guid=${GUID}`;
      const data = await jsonpFetch(url);

      // The JSON service returns { Abn, AbnStatus, EntityName / ... }
      if (data && data.Abn) {
        const name =
          data.EntityName
          || (data.MainName && data.MainName.OrganisationName)
          || (data.OtherEntity && data.OtherEntity.NonIndividualName && data.OtherEntity.NonIndividualName.NonIndividualNameText)
          || '';

        const suburb   = data.AddressSuburb   || '';
        const state    = data.AddressState    || '';
        const postcode = data.AddressPostcode || '';
        const address  = [suburb, state, postcode].filter(Boolean).join(', ');

        return {
          success: true,
          data: {
            abn:           abn,
            abnFormatted:  formatABN(abn),
            legalName:     name,
            status:        data.AbnStatus || '',
            gstRegistered: !!(data.Gst),
            address:       { full: address }
          }
        };
      }

      return { success: false, error: 'No active ABN found' };

    } catch (jsonpErr) {
      console.warn('ABN JSON lookup failed, trying XML fallback:', jsonpErr);
    }

    /* ── 2. Fallback: XML HTTP-GET via CORS proxy ── */
    try {
      const xmlUrl  = `${XML_BASE}SearchByABNv202001?searchString=${abn}&includeHistoricalDetails=N&authenticationGuid=${GUID}`;
      const proxied = `${CORS_PROXY}${encodeURIComponent(xmlUrl)}`;
      const resp    = await fetch(proxied);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const xmlText = await resp.text();
      return parseXMLResponse(xmlText, abn);
    } catch (xmlErr) {
      console.error('ABN XML fallback failed:', xmlErr);
      return { success: false, error: 'Service unavailable – please try again shortly' };
    }
  }

  /* ════════════════════════════════════════
     Search by Name  –  JSON endpoint first,
     XML fallback
  ════════════════════════════════════════ */

  async function searchByName(name) {
    /* ── 1. JSON service ── */
    try {
      const url  = `${JSON_BASE}MatchingNames.aspx?name=${encodeURIComponent(name)}&guid=${GUID}`;
      const data = await jsonpFetch(url);

      // Returns { Names: [ { Abn, Name }, … ] }
      if (data && Array.isArray(data.Names) && data.Names.length > 0) {
        const results = data.Names.map(n => ({
          abn:          digitsOnly(n.Abn),
          abnFormatted: formatABN(n.Abn),
          name:         n.Name
        }));
        return { success: true, data: results, isList: true };
      }
      return { success: false, error: 'No matching businesses found' };

    } catch (jsonpErr) {
      console.warn('Name JSON lookup failed, trying XML fallback:', jsonpErr);
    }

    /* ── 2. Fallback: XML via proxy using ABRSearchByNameAdvancedSimpleProtocol2017 ── */
    try {
      const xmlUrl  = `${XML_BASE}ABRSearchByNameAdvancedSimpleProtocol2017?name=${encodeURIComponent(name)}&guid=${GUID}&maxResults=10&includeHistoricalDetails=N`;
      const proxied = `${CORS_PROXY}${encodeURIComponent(xmlUrl)}`;
      const resp    = await fetch(proxied);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const xmlText = await resp.text();
      return parseXMLNameResults(xmlText);
    } catch (err) {
      console.error('Name XML fallback failed:', err);
      return { success: false, error: 'Search failed – please try again' };
    }
  }

  /* ════════════════════════════════════════
     XML parsers (used only by fallbacks)
  ════════════════════════════════════════ */

  function parseXMLResponse(xmlText, abn) {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(xmlText, 'text/xml');

    const exception = doc.querySelector('exception, Exception, exceptionDescription, ExceptionDescription');
    if (exception) {
      return { success: false, error: exception.textContent.trim() || 'API error' };
    }

    function q(tag) {
      return doc.querySelector(tag)
          || doc.querySelector(tag.toLowerCase())
          || doc.querySelector(tag[0].toUpperCase() + tag.slice(1));
    }

    const legalName =
      q('legalName')?.textContent
      || q('mainName')?.querySelector?.('organisationName, OrganisationName')?.textContent
      || q('otherEntity')?.querySelector?.('nonIndividualName, NonIndividualName')
                         ?.querySelector?.('nonIndividualNameText, NonIndividualNameText')?.textContent
      || '';

    const abnStatus = q('abnStatus')?.textContent || q('AbnStatus')?.textContent || '';

    const suburb   = q('mainBusinessPhysicalAddress')?.querySelector?.('suburb, Suburb')?.textContent
                     || q('addressSuburb')?.textContent || '';
    const state    = q('mainBusinessPhysicalAddress')?.querySelector?.('stateCode, StateCode')?.textContent
                     || q('addressState')?.textContent || '';
    const postcode = q('mainBusinessPhysicalAddress')?.querySelector?.('postcode, Postcode')?.textContent
                     || q('addressPostcode')?.textContent || '';

    if (!legalName) {
      return { success: false, error: 'No business found with that ABN' };
    }

    return {
      success: true,
      data: {
        abn:           abn,
        abnFormatted:  formatABN(abn),
        legalName:     legalName.trim(),
        status:        abnStatus.trim(),
        gstRegistered: false,
        address:       { full: [suburb, state, postcode].filter(Boolean).join(', ') }
      }
    };
  }

  function parseXMLNameResults(xmlText) {
    const parser  = new DOMParser();
    const doc     = parser.parseFromString(xmlText, 'text/xml');
    const results = [];

    doc.querySelectorAll('searchResultsList, SearchResultsList').forEach(list => {
      list.querySelectorAll('searchResultsRecord, SearchResultsRecord').forEach(record => {
        const abn  = record.querySelector('abn, Abn')?.textContent || '';
        const name = record.querySelector('mainName organisationName, MainName OrganisationName, name, Name')?.textContent || '';
        if (abn) {
          results.push({
            abn:          digitsOnly(abn),
            abnFormatted: formatABN(abn),
            name:         name || abn
          });
        }
      });
    });

    if (results.length > 0) {
      return { success: true, data: results, isList: true };
    }
    return { success: false, error: 'No matching businesses found' };
  }

  /* ════════════════════════════════════════
     Main search dispatcher
  ════════════════════════════════════════ */

  async function search(query) {
    if (!query || !query.trim()) {
      return { success: false, error: 'Please enter an ABN or business name' };
    }

    const q      = query.trim();
    const digits = digitsOnly(q);

    // Treat it as an ABN if the digit-only version is 11 characters
    // (handles formatted input like "12 345 678 901" or "12-345-678-901")
    if (digits.length === 11) {
      return await searchByABN(digits);
    }

    // Partial digit sequences (< 11) get routed to name search
    return await searchByName(q);
  }

  /* ════════════════════════════════════════
     Auto-fill client form fields
  ════════════════════════════════════════ */

  function fillClientForm(businessData) {
    const set = (id, value, stateKey) => {
      const el = document.getElementById(id);
      if (el && value) {
        el.value = value;
        if (typeof InvoiceState !== 'undefined' && stateKey) InvoiceState[stateKey] = value;
      }
    };

    set('inv-client-name',    businessData.legalName,     'clientName');
    set('inv-client-abn',     businessData.abnFormatted,  'clientAbn');
    set('inv-client-address', businessData.address?.full, 'clientAddress');

    if (typeof InvoicePreview !== 'undefined') InvoicePreview.refresh();
    return { success: true };
  }

  /* ════════════════════════════════════════
     Build the search UI widget
  ════════════════════════════════════════ */

  function createSearchUI(options = {}) {
    const {
      onSuccess,
      onError,
      placeholder = 'Enter ABN (e.g. 51 824 753 556) or business name…'
    } = options;

    const container = document.createElement('div');
    container.className = 'abn-lookup-ui';
    container.style.cssText = 'margin-bottom: 16px;';

  container.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;">
      <div style="flex:1;">
        <input type="text" class="form-input" id="abn-search-global"
          placeholder="${placeholder}" style="width:100%;" autocomplete="off">
      </div>
      <button class="btn btn-primary" id="abn-search-btn" style="white-space:nowrap;">Search &amp; fill →</button>
    </div>
    <div id="abn-search-status" style="margin-top:6px;min-height:18px;"></div>
    <div id="abn-results-list"  style="margin-top:8px;"></div>
  `;

    const searchInput = container.querySelector('#abn-search-global');
    const searchBtn   = container.querySelector('#abn-search-btn');
    const statusDiv   = container.querySelector('#abn-search-status');
    const resultsDiv  = container.querySelector('#abn-results-list');

   async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      statusDiv.textContent = 'Please enter an ABN or business name';
      statusDiv.style.color = 'var(--coral)';
      return;
    }

    resultsDiv.innerHTML = '';
    setLoading(searchBtn, statusDiv, true);

    const result = await search(query);

    // Stop button animation first, then kill status dots separately
    setLoading(searchBtn, null, false);
    stopDotsAnimation(statusDiv);

    if (result.success) {
      if (!result.isList) {
        fillClientForm(result.data);
        if (onSuccess) onSuccess(result.data);
        statusDiv.textContent = `✓ Found: ${result.data.legalName}`;
        statusDiv.style.color = 'var(--green)';
      } else {
        statusDiv.textContent = `Found ${result.data.length} matching businesses – click to select`;
        statusDiv.style.color = 'var(--gold)';

      resultsDiv.innerHTML = `
        <div style="border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;">
          ${result.data.map(item => `
            <div class="abn-result-item"
              data-abn="${escapeHtml(item.abn)}"
              style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border);
                    background:var(--surface);transition:background 0.1s;"
              onmouseover="this.style.background='var(--surface2)'"
              onmouseout="this.style.background='var(--surface)'">
              <div style="font-weight:500;">${escapeHtml(item.name)}</div>
              <div style="color:var(--text3);">${escapeHtml(item.abnFormatted)}</div>
            </div>
          `).join('')}
        </div>
      `;

        resultsDiv.querySelectorAll('.abn-result-item').forEach(item => {
          item.addEventListener('click', async () => {
            searchInput.value = item.dataset.abn;
            resultsDiv.innerHTML = '';
            await performSearch();
          });
        });
      }
    } else {
      if (onError) onError(result.error);
      statusDiv.textContent = result.error;
      statusDiv.style.color = 'var(--coral)';
    }
  }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performSearch(); });

    return container;
  }

  /* ════════════════════════════════════════
     Public API
  ════════════════════════════════════════ */
  return {
    search,         // async (query) → { success, data | error }
    searchByABN,    // async (abn)   → { success, data | error }
    searchByName,   // async (name)  → { success, data[], isList | error }
    fillClientForm, // (businessData) → { success }
    createSearchUI, // (options)    → HTMLElement
    formatABN,      // (string)     → "XX XXX XXX XXX"
    isValidABN      // (string)     → boolean (checksum only, no network)
  };

})();