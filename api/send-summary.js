// Sends a formatted HTML email summary to the user via Resend.
// The email address is used ONLY to send — it is never logged or stored.

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Values Card Game <onboarding@resend.dev>';

function buildEmail({ pyramid, kept, portrait }) {
    const ranks  = ['◆ Most important', '2nd', '3rd', '4th', '5th', '6th'];
    const accent = '#A86535';
    const bg     = '#F5F1E9';
    const dark   = '#1E1812';
    const mid    = '#6A6460';
    const light  = '#A89F97';
    const serif  = 'Georgia, "Times New Roman", serif';
    const sans   = 'Arial, Helvetica, sans-serif';

    const pyramidRows = pyramid.map((v, i) => `
        <tr>
            <td style="padding:6px 0;border-bottom:1px solid #EAE6DC;">
                <span style="font-size:11px;color:${i === 0 ? accent : light};
                      font-family:${sans};letter-spacing:0.06em;
                      text-transform:uppercase;display:block;margin-bottom:2px;">
                    ${ranks[i]}
                </span>
                <span style="font-size:${i === 0 ? 20 : 16}px;
                      color:${i === 0 ? accent : dark};
                      font-family:${serif};
                      font-weight:${i === 0 ? 'bold' : 'normal'};">
                    ${v}
                </span>
            </td>
        </tr>`).join('');

    const keptPills = kept.map(v =>
        `<span style="display:inline-block;margin:4px;padding:6px 14px;
               background:#EAE6DC;border-radius:20px;font-size:13px;
               color:#2E2318;font-family:${sans};">${v}</span>`
    ).join('');

    const portraitHtml = portrait
        ? `<table width="100%" cellpadding="0" cellspacing="0">
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
               <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #DDD8CE;margin:0;"></td></tr>
           </table>`
        : '';

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

    <table width="100%" cellpadding="0" cellspacing="0"
           style="max-width:560px;background:#FDFAF5;border-radius:12px;
                  overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

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

        <!-- Top 6 -->
        <tr>
            <td style="padding:32px 40px 0;">
                <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.1em;
                           text-transform:uppercase;color:${light};font-family:${sans};">
                    Your top 6 values
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${pyramidRows}
                </table>
            </td>
        </tr>

        <!-- 12 kept -->
        <tr>
            <td style="padding:32px 40px 0;">
                <hr style="border:none;border-top:1px solid #DDD8CE;margin:0 0 24px;">
                <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.1em;
                           text-transform:uppercase;color:${light};font-family:${sans};">
                    Your 12 values
                </p>
                <div>${keptPills}</div>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="padding:36px 40px;text-align:center;">
                <p style="margin:0;font-size:12px;color:${light};font-family:${sans};">
                    Values Card Game &nbsp;·&nbsp; whatdoyouvaluemost.com
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

    const { email, gameData } = req.body || {};
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    // Email is used here and nowhere else — it is not logged or stored
    const html = buildEmail({
        pyramid:  gameData?.pyramid  || [],
        kept:     gameData?.kept     || [],
        portrait: gameData?.portrait || ''
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

    return res.status(200).json({ ok: true });
};
