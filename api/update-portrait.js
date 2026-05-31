// Patches the ai_portrait field on an existing session row.
// Called after portrait generation completes — non-critical, best-effort.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST')   return res.status(405).end();

    const { id, portrait } = req.body || {};
    if (!id || !portrait) return res.status(400).json({ error: 'Missing id or portrait' });

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({ error: 'Server not configured' });
    }

    const dbRes = await fetch(
        `${SUPABASE_URL}/rest/v1/sessions?id=eq.${encodeURIComponent(id)}`,
        {
            method: 'PATCH',
            headers: {
                'apikey':        SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type':  'application/json',
                'Prefer':        'return=minimal'
            },
            body: JSON.stringify({ ai_portrait: portrait })
        }
    );

    if (!dbRes.ok) {
        const err = await dbRes.text();
        console.error('Portrait update failed:', err);
        return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ ok: true });
};
