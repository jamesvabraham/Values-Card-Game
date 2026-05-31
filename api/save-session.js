// Saves an anonymous game session to Supabase.
// The email address is NEVER passed to or stored by this function.

const SUPABASE_URL = process.env.SUPABASE_URL; // e.g. https://xxx.supabase.co
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function parseUA(ua = '') {
    const mobile  = /Mobile|Android|iPhone/i.test(ua);
    const tablet  = /iPad|Tablet/i.test(ua);
    const device  = tablet ? 'tablet' : mobile ? 'mobile' : 'desktop';

    let browser = 'Unknown';
    if      (/Firefox/i.test(ua))                          browser = 'Firefox';
    else if (/Edg/i.test(ua))                              browser = 'Edge';
    else if (/OPR|Opera/i.test(ua))                        browser = 'Opera';
    else if (/Chrome/i.test(ua))                           browser = 'Chrome';
    else if (/Safari/i.test(ua))                           browser = 'Safari';

    let os = 'Unknown';
    if      (/iPhone/i.test(ua))                           os = 'iOS';
    else if (/iPad/i.test(ua))                             os = 'iPadOS';
    else if (/Android/i.test(ua))                          os = 'Android';
    else if (/Windows/i.test(ua))                          os = 'Windows';
    else if (/Mac OS X/i.test(ua))                         os = 'macOS';
    else if (/Linux/i.test(ua))                            os = 'Linux';

    return { device, browser, os };
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST')   return res.status(405).end();

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        return res.status(500).json({ error: 'Server not configured' });
    }

    const { browserId, gameData } = req.body || {};

    // ── IP & geolocation ────────────────────────────────────────────────────
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
             || req.socket?.remoteAddress
             || '';

    let country = null, city = null, region = null;
    if (ip && ip !== '127.0.0.1' && ip !== '::1') {
        try {
            const geo = await fetch(`https://ipapi.co/${ip}/json/`, {
                headers: { 'User-Agent': 'values-card-game/1.0' }
            });
            if (geo.ok) {
                const g = await geo.json();
                country = g.country_name || null;
                city    = g.city         || null;
                region  = g.region       || null;
            }
        } catch (_) { /* geolocation is best-effort */ }
    }

    // ── User-agent ─────────────────────────────────────────────────────────
    const ua = req.headers['user-agent'] || '';
    const { device, browser, os } = parseUA(ua);

    // ── Insert into Supabase ────────────────────────────────────────────────
    const row = {
        browser_id:       browserId  || null,
        ip_address:       ip         || null,
        country,
        city,
        region,
        device_type:      device,
        browser,
        os,
        values_selected:  gameData?.selected   || [],
        values_kept:      gameData?.kept        || [],
        values_discarded: gameData?.discarded   || [],
        pair_comparisons: gameData?.comparisons || [],
        pyramid_order:    gameData?.pyramid     || [],
        ai_portrait:      gameData?.portrait    || null,
        email_sent:       false
    };

    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/sessions`, {
        method: 'POST',
        headers: {
            'apikey':        SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type':  'application/json',
            'Prefer':        'return=minimal'
        },
        body: JSON.stringify(row)
    });

    if (!dbRes.ok) {
        const err = await dbRes.text();
        console.error('Supabase insert failed:', err);
        return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ ok: true });
};
