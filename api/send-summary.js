// Sends a formatted HTML email summary to the user via Resend.
// The email address is used ONLY to send — it is never logged or stored.

const RESEND_KEY    = process.env.RESEND_API_KEY;
const FROM_EMAIL    = process.env.FROM_EMAIL || 'Values Card Game <onboarding@resend.dev>';
const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

function card(value, label, bgColor, borderColor, textColor, labelColor, size) {
    const serif = 'Georgia, "Times New Roman", serif';
    const sans  = 'Arial, Helvetica, sans-serif';
    return `
        <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center" style="background:${bgColor};border:1px solid ${borderColor};
                            border-radius:8px;padding:14px 10px;text-align:center;">
                    <p style="margin:0 0 5px;font-size:10px;letter-spacing:0.1em;
                               text-transform:uppercase;color:${labelColor};
                               font-family:${sans};">${label}</p>
                    <p style="margin:0;font-size:${size}px;color:${textColor};
                               font-family:${serif};font-weight:bold;
                               line-height:1.2;">${value}</p>
                </td>
            </tr>
        </table>`;
}

function buildEmail({ pyramid, kept, discarded, portrait }) {
    const accent      = '#A86535';
    const accentPale  = '#F4EDE3';
    const accentBorder= '#C8834A';
    const bg          = '#F5F1E9';
    const surface     = '#FDFAF5';
    const surfaceAlt  = '#EAE6DC';
    const border      = '#DDD8CE';
    const dark        = '#1E1812';
    const light       = '#A89F97';
    const serif       = 'Georgia, "Times New Roman", serif';
    const sans        = 'Arial, Helvetica, sans-serif';

    // Pyramid — nested tables so email clients render it reliably
    const apexCard   = card(pyramid[0] || '', '◆ Apex',   accentPale, accentBorder, accent, accent,  20);
    const mid1Card   = card(pyramid[1] || '', 'Middle',   surface,    border,       dark,   light,   16);
    const mid2Card   = card(pyramid[2] || '', 'Middle',   surface,    border,       dark,   light,   16);
    const base1Card  = card(pyramid[3] || '', 'Base',     surfaceAlt, border,       dark,   light,   14);
    const base2Card  = card(pyramid[4] || '', 'Base',     surfaceAlt, border,       dark,   light,   14);
    const base3Card  = card(pyramid[5] || '', 'Base',     surfaceAlt, border,       dark,   light,   14);

    const pyramidHtml = `
        <!-- Apex -->
        <tr>
            <td align="center" style="padding-bottom:6px;">
                <table cellpadding="0" cellspacing="0" width="190" style="margin:0 auto;">
                    <tr><td>${apexCard}</td></tr>
                </table>
            </td>
        </tr>
        <!-- Middle row -->
        <tr>
            <td align="center" style="padding-bottom:6px;">
                <table cellpadding="0" cellspacing="0" width="380" style="margin:0 auto;">
                    <tr>
                        <td width="187" style="padding-right:3px;">${mid1Card}</td>
                        <td width="187" style="padding-left:3px;">${mid2Card}</td>
                    </tr>
                </table>
            </td>
        </tr>
        <!-- Base row -->
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" width="456" style="margin:0 auto;">
                    <tr>
                        <td width="148" style="padding-right:3px;">${base1Card}</td>
                        <td width="148" style="padding:0 3px;">${base2Card}</td>
                        <td width="148" style="padding-left:3px;">${base3Card}</td>
                    </tr>
                </table>
            </td>
        </tr>`;

    const keptPills = kept.map(v =>
        `<span style="display:inline-block;margin:4px;padding:6px 14px;
               background:${surfaceAlt};border-radius:20px;font-size:13px;
               color:#2E2318;font-family:${sans};">${v}</span>`
    ).join('');

    const discardedPills = (discarded || []).map(v =>
        `<span style="display:inline-block;margin:4px;padding:6px 14px;
               background:${surface};border:1px solid ${border};border-radius:20px;
               font-size:13px;color:#A89F97;font-family:${sans};
               text-decoration:line-through;">${v}</span>`
    ).join('');

    const portraitHtml = portrait ? `
        <tr>
            <td style="padding:32px 40px;">
                <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.1em;
                           text-transform:uppercase;color:${light};font-family:${sans};">
                    Your values portrait
                </p>
                <p style="margin:0;font-size:18px;line-height:1.7;
                           color:${dark};font-style:italic;font-family:${serif};">
                    &ldquo;${portrait}&rdquo;
                </p>
            </td>
        </tr>
        <tr><td style="padding:0 40px;">
            <hr style="border:none;border-top:1px solid ${border};margin:0;">
        </td></tr>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Your Values Portrait</title>
</head>
<body style="margin:0;padding:0;background:${bg};">
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:${bg};padding:40px 20px;">
    <tr><td align="center">

    <table width="560" cellpadding="0" cellspacing="0"
           style="max-width:560px;background:${surface};border-radius:12px;overflow:hidden;">

        <!-- Header -->
        <tr>
            <td style="background:${dark};padding:36px 40px;text-align:center;">
                <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;
                           text-transform:uppercase;color:#8A7E76;font-family:${sans};">
                    A reflective exercise
                </p>
                <h1 style="margin:0;font-size:30px;font-weight:normal;
                            color:#EDE7DF;font-family:${serif};">
                    What matters most to you
                </h1>
            </td>
        </tr>

        <!-- Portrait -->
        ${portraitHtml}

        <!-- Pyramid -->
        <tr>
            <td style="padding:32px 40px 0;">
                <p style="margin:0 0 20px;font-size:11px;letter-spacing:0.1em;
                           text-transform:uppercase;color:${light};font-family:${sans};">
                    Your values pyramid
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${pyramidHtml}
                </table>
            </td>
        </tr>

        <!-- 12 kept -->
        <tr>
            <td style="padding:32px 40px 0;">
                <hr style="border:none;border-top:1px solid ${border};margin:0 0 24px;">
                <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.1em;
                           text-transform:uppercase;color:${light};font-family:${sans};">
                    Your 12 kept values
                </p>
                <div>${keptPills}</div>
            </td>
        </tr>

        <!-- 12 discarded -->
        <tr>
            <td style="padding:24px 40px 0;">
                <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.1em;
                           text-transform:uppercase;color:${light};font-family:${sans};">
                    12 values you let go
                </p>
                <div>${discardedPills}</div>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="padding:36px 40px;text-align:center;">
                <p style="margin:0;font-size:12px;color:${light};font-family:${sans};">
                    Values Card Game
                </p>
            </td>
        </tr>

    </table>
    </td></tr>
</table>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST')   return res.status(405).end();

    if (!RESEND_KEY) {
        return res.status(500).json({ error: 'RESEND_API_KEY is not configured' });
    }

    const { email, rowId, gameData } = req.body || {};
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    // Email is used here and nowhere else — it is not logged or stored
    const html = buildEmail({
        pyramid:   gameData?.pyramid   || [],
        kept:      gameData?.kept      || [],
        discarded: gameData?.discarded || [],
        portrait:  gameData?.portrait  || ''
    });

    const sendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type':  'application/json'
        },
        body: JSON.stringify({
            from:    FROM_EMAIL,
            to:      email,
            subject: 'Your values portrait',
            html
        })
    });

    if (!sendRes.ok) {
        const err = await sendRes.json().catch(() => ({}));
        console.error('Resend error:', err);
        return res.status(500).json({ error: 'Failed to send email' });
    }

    // Mark email_sent = true on the session row (best-effort)
    if (rowId && SUPABASE_URL && SUPABASE_KEY) {
        await fetch(
            `${SUPABASE_URL}/rest/v1/sessions?id=eq.${encodeURIComponent(rowId)}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey':        SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type':  'application/json',
                    'Prefer':        'return=minimal'
                },
                body: JSON.stringify({ email_sent: true })
            }
        ).catch(e => console.warn('email_sent update failed:', e.message));
    }

    return res.status(200).json({ ok: true });
};
