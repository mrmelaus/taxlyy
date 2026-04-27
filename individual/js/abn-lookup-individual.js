// ========================================
// ABN LOOKUP - INDIVIDUAL (Taxlyy Individual)
// Supports multiple results for name search
// ========================================

var ABNLookup = (function () {
    const GUID = '23c0784b-47a8-49d1-b247-c70e1c8de9fc';
    const JSON_BASE = 'https://abr.business.gov.au/json/';
    const XML_BASE = 'https://abr.business.gov.au/ABRXMLSearch/AbrXmlSearch.asmx/';
    const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

    function digitsOnly(str) {
        return (str || '').replace(/\D/g, '');
    }

    function formatABN(abn) {
        const d = digitsOnly(abn);
        if (d.length !== 11) return abn || '';
        return d.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }

    function isValidABN(abn) {
        const d = digitsOnly(abn);
        if (d.length !== 11) return false;
        const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
        const digits = d.split('').map(Number);
        digits[0] -= 1;
        const sum = digits.reduce((acc, n, i) => acc + n * weights[i], 0);
        return sum % 89 === 0;
    }

    function jsonpFetch(url) {
        return new Promise((resolve, reject) => {
            const cbName = '_abrCb_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
            const script = document.createElement('script');
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

    async function searchByABN(rawAbn) {
        const abn = digitsOnly(rawAbn);
        if (!isValidABN(abn)) {
            return { success: false, error: 'Invalid ABN – please check the number' };
        }
        try {
            const url = `${JSON_BASE}AbnDetails.aspx?abn=${abn}&guid=${GUID}`;
            const data = await jsonpFetch(url);
            if (data && data.Abn) {
                const name = data.EntityName ||
                    (data.MainName && data.MainName.OrganisationName) ||
                    (data.OtherEntity && data.OtherEntity.NonIndividualName && data.OtherEntity.NonIndividualName.NonIndividualNameText) ||
                    '';
                if (!name) return { success: false, error: 'No active business name found' };
                return {
                    success: true,
                    data: {
                        abn: abn,
                        abnFormatted: formatABN(abn),
                        legalName: name.trim()
                    }
                };
            }
            return { success: false, error: 'No active ABN found' };
        } catch (err) {
            console.warn('JSONP ABN lookup failed, trying XML fallback:', err);
            return xmlABNFallback(abn);
        }
    }

    async function xmlABNFallback(abn) {
        try {
            const xmlUrl = `${XML_BASE}SearchByABNv202001?searchString=${abn}&includeHistoricalDetails=N&authenticationGuid=${GUID}`;
            const proxied = `${CORS_PROXY}${encodeURIComponent(xmlUrl)}`;
            const resp = await fetch(proxied);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const xmlText = await resp.text();
            return parseXMLResponse(xmlText, abn);
        } catch (err) {
            console.error('XML fallback failed:', err);
            return { success: false, error: 'Service unavailable – please try again later' };
        }
    }

    async function searchByName(name) {
        // JSONP first
        try {
            const url = `${JSON_BASE}MatchingNames.aspx?name=${encodeURIComponent(name)}&guid=${GUID}`;
            const data = await jsonpFetch(url);
            if (data && Array.isArray(data.Names) && data.Names.length > 0) {
                const results = data.Names.map(n => ({
                    abn: digitsOnly(n.Abn),
                    abnFormatted: formatABN(n.Abn),
                    legalName: n.Name
                }));
                return { success: true, data: results, isList: true };
            }
            return { success: false, error: 'No matching business found' };
        } catch (err) {
            console.warn('JSONP name lookup failed, trying XML fallback:', err);
            return xmlNameFallback(name);
        }
    }

    async function xmlNameFallback(name) {
        try {
            const xmlUrl = `${XML_BASE}ABRSearchByNameAdvancedSimpleProtocol2017?name=${encodeURIComponent(name)}&guid=${GUID}&maxResults=10&includeHistoricalDetails=N`;
            const proxied = `${CORS_PROXY}${encodeURIComponent(xmlUrl)}`;
            const resp = await fetch(proxied);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const xmlText = await resp.text();
            return parseXMLNameResponse(xmlText);
        } catch (err) {
            console.error('XML name lookup failed:', err);
            return { success: false, error: 'Search failed – please try again' };
        }
    }

    function parseXMLResponse(xmlText, abn) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const legalName = doc.querySelector('legalName')?.textContent ||
                          doc.querySelector('LegalName')?.textContent ||
                          '';
        if (!legalName) return { success: false, error: 'No business found with that ABN' };
        return {
            success: true,
            data: {
                abn: abn,
                abnFormatted: formatABN(abn),
                legalName: legalName.trim()
            }
        };
    }

    function parseXMLNameResponse(xmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const results = [];
        doc.querySelectorAll('searchResultsRecord, SearchResultsRecord').forEach(record => {
            const abn = record.querySelector('abn, Abn')?.textContent || '';
            const name = record.querySelector('organisationName, OrganisationName, name, Name')?.textContent || '';
            if (abn) {
                results.push({
                    abn: digitsOnly(abn),
                    abnFormatted: formatABN(abn),
                    legalName: name
                });
            }
        });
        if (results.length > 0) {
            return { success: true, data: results, isList: true };
        }
        return { success: false, error: 'No matching business found' };
    }

    async function search(query) {
        if (!query || !query.trim()) {
            return { success: false, error: 'Please enter an ABN or business name' };
        }
        const q = query.trim();
        const digits = digitsOnly(q);
        if (digits.length === 11) {
            return await searchByABN(digits);
        }
        return await searchByName(q);
    }

    return {
        search,
        formatABN,
        isValidABN
    };
})();