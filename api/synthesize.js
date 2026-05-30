// Vercel serverless function — proxies Claude API calls so the API key
// never leaves the server. Set CLAUDE_API_KEY in the Vercel dashboard
// (Project → Settings → Environment Variables).

module.exports = async function handler(req, res) {
    // ── CORS headers (allows the browser to reach this endpoint) ──────────
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── API key ────────────────────────────────────────────────────────────
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            error: 'CLAUDE_API_KEY is not configured. Set it in your Vercel project environment variables.'
        });
    }

    // ── Forward the request body to Anthropic ──────────────────────────────
    try {
        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(req.body)
        });

        const data = await upstream.json();
        return res.status(upstream.status).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
