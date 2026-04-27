// js/supabase-client.js — add schema option
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: {
        schema: 'individual'  // ← add this if your tables are in 'individual' schema
    }
});

window.supabase = supabaseClient;  