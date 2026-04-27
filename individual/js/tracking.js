// ============================================
// SESSION & ATTRIBUTION TRACKING
// ============================================

// Generate a UUID v4 for session token
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Get attribution from URL ref parameter or fallback
async function getAttributionFromRef() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
        const { data, error } = await supabase
            .from('campaign_links')
            .select('utm_source, utm_medium, utm_campaign, utm_content')
            .eq('ref_code', refCode)
            .maybeSingle();
        if (data) return data;
    }
    // Fallback: try to read direct UTM parameters (if any)
    return {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_content: urlParams.get('utm_content')
    };
}

// Create a new user session in Supabase
async function createSession(attribution) {
    const sessionToken = generateUUID();
    const { data, error } = await supabase
        .from('user_sessions')
        .insert({
            session_token: sessionToken,
            utm_source: attribution.utm_source,
            utm_medium: attribution.utm_medium,
            utm_campaign: attribution.utm_campaign,
            utm_content: attribution.utm_content,
            referrer: document.referrer || null,
            landing_page: window.location.href,
            started_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString()
        })
        .select('id')
        .single();
    if (error) {
        console.error('Failed to create session:', error);
        return null;
    }
    sessionStorage.setItem('sessionId', data.id);
    sessionStorage.setItem('sessionToken', sessionToken);
    return data.id;
}

// Global event logger
async function logEvent(eventName, properties = {}) {
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) return;
    try {
        await supabase
            .from('analytics_events')
            .insert({
                session_id: sessionId,
                event_name: eventName,
                event_properties: properties
            });
        // Optional: remove console.log in production
        // console.log(`Event logged: ${eventName}`);
    } catch (err) {
        console.error('Failed to log event:', err);
    }
}

// Initialize tracking on page load
async function initTracking() {
    const attribution = await getAttributionFromRef();
    const sessionId = await createSession(attribution);
    if (sessionId) {
        await logEvent('page_view', { path: window.location.pathname });
    }
}

// Expose functions globally (after they are defined)
window.logEvent = logEvent;
window.initTracking = initTracking;