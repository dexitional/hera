import nodemailer, { type Transporter } from 'nodemailer';

// Transactional email (account verification, password reset, vote receipts)
// sent through Gmail's SMTP server with an App Password.
//
// Setup: on the sending Google account turn on 2-Step Verification, then
// create an App Password (Google Account -> Security -> App passwords) and set
//   GMAIL_USER=you@gmail.com            (or a Google Workspace address)
//   GMAIL_APP_PASSWORD=abcdefghijklmnop (spaces as shown by Google are fine)
// Optional:
//   SMTP_FROM_NAME=Heravote             display name on outgoing mail
//   GMAIL_FROM_ADDRESS=...              only if it is a verified "Send mail as"
//                                       alias of GMAIL_USER; otherwise Gmail
//                                       rewrites From to GMAIL_USER anyway
//
// Sending limits: about 500 recipients/day for a personal Gmail account and
// about 2,000/day for Google Workspace. Large Google-login elections send one
// receipt per vote, so plan for those limits.
//
// Kept out of the createServerFn modules (see paystack-credit.ts). Only ever
// imported server-side: src/lib/auth.ts and the vote-receipt workflow.

const GMAIL_SMTP = { host: 'smtp.gmail.com', port: 465, secure: true } as const;

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  const user = process.env.GMAIL_USER?.trim();
  // Google displays App Passwords in groups of four ("abcd efgh ijkl mnop").
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  if (!user || !pass) {
    throw new Error('sendEmail: GMAIL_USER and GMAIL_APP_PASSWORD must be configured.');
  }
  transporter ??= nodemailer.createTransport({
    ...GMAIL_SMTP,
    auth: { user, pass },
    // Reuse a few authenticated connections instead of logging in per email.
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });
  return transporter;
}

/** Plain-text alternative part: improves deliverability and readability in text-only clients. */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
      const text = label.replace(/<[^>]+>/g, '').trim();
      return text && text !== href ? `${text} (${href})` : href;
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h[1-6]|tr|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&copy;/g, '(c)')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

// Throws on any failure (missing credentials, auth rejected, network error)
// instead of swallowing it -- a caller that silently no-ops on a broken mail
// setup looks identical to a successful send. Callers that must never fail
// their own flow because of a mail hiccup (e.g. better-auth's
// sendVerificationEmail) are responsible for catching this.
export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const mailer = getTransporter();
  const fromName = process.env.SMTP_FROM_NAME || 'Heravote';
  const fromAddress = process.env.GMAIL_FROM_ADDRESS?.trim() || process.env.GMAIL_USER!.trim();

  try {
    await mailer.sendMail({
      from: { name: fromName, address: fromAddress },
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: htmlToText(params.html),
    });
  } catch (err: any) {
    // EAUTH usually means a wrong App Password, or 2-Step Verification is off.
    const hint = err?.code === 'EAUTH' ? ' (check GMAIL_USER / GMAIL_APP_PASSWORD)' : '';
    throw new Error(`sendEmail: Gmail SMTP send failed${hint}: ${err?.message ?? err}`);
  }
}

/** Opens an SMTP session and checks the credentials, without sending anything. */
export async function verifyEmailTransport(): Promise<void> {
  await getTransporter().verify();
}

// ==========================================
// SHARED EMAIL LAYOUT
// ==========================================
// One branded shell (logo header, card body, footer) every transactional
// email renders through, so new templates only need to supply their own
// body markup instead of re-building the wrapper each time. Table-based and
// inline-styled throughout -- email clients (Outlook in particular) don't
// reliably support flexbox/grid or <style> blocks.
const BRAND = {
  name: 'Heravote',
  primary: '#6d28d9',
  navy: '#0a192a',
  // Matches the header/footer wordmark used across the site -- already a
  // flattened navy-background PNG, so it drops into the header band as a
  // self-contained banner with no extra styling needed.
  logoUrl: `${process.env.BETTER_AUTH_URL || 'https://www.heravote.com'}/logo512.png`,
};

function renderEmailLayout(params: { preheader?: string; bodyHtml: string }): string {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${BRAND.name}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f7;">
    ${params.preheader ? `<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; opacity:0;">${params.preheader}</div>` : ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 10px rgba(10,25,42,0.08);">
            <tr>
              <td align="center" bgcolor="${BRAND.navy}" style="background-color:${BRAND.navy}; padding:28px 24px;">
                <img src="${BRAND.logoUrl}" alt="${BRAND.name}" width="180" style="display:block; width:180px; max-width:100%; height:auto; border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px; font-family:Arial, Helvetica, sans-serif; color:#18181b;">
                ${params.bodyHtml}
              </td>
            </tr>
            <tr>
              <td align="center" bgcolor="#fafafa" style="background-color:#fafafa; border-top:1px solid #eee; padding:18px 24px;">
                <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#999;">
                  &copy; ${year} ${BRAND.name}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function verificationEmailHtml(params: { name: string; url: string }): string {
  const bodyHtml = `
    <h2 style="margin:0 0 16px; font-family:Arial, Helvetica, sans-serif; font-size:20px; color:${BRAND.primary};">Verify your account</h2>
    <p style="margin:0 0 12px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#18181b;">Hi ${params.name},</p>
    <p style="margin:0 0 24px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#18181b;">Thanks for signing up. Please confirm your email address to activate your account:</p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" bgcolor="${BRAND.primary}" style="background-color:${BRAND.primary}; border-radius:10px;">
          <a href="${params.url}" style="display:inline-block; padding:14px 28px; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.5; color:#666;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${params.url}" style="color:${BRAND.primary}; word-break:break-all;">${params.url}</a>
    </p>
    <p style="margin:16px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#999;">If you didn't create a Heravote account, you can safely ignore this email.</p>
  `;

  return renderEmailLayout({
    preheader: 'Confirm your email address to activate your Heravote account.',
    bodyHtml,
  });
}

export function passwordResetEmailHtml(params: { name: string; url: string }): string {
  const name = escapeHtml(params.name || 'there');
  const url = escapeHtml(params.url);
  const bodyHtml = `
    <h2 style="margin:0 0 16px; font-family:Arial, Helvetica, sans-serif; font-size:20px; color:${BRAND.primary};">Reset your password</h2>
    <p style="margin:0 0 12px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#18181b;">Hi ${name},</p>
    <p style="margin:0 0 24px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#18181b;">We received a request to reset the password for your Heravote account. Choose a new password using the button below. The link works once and expires in 1 hour.</p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" bgcolor="${BRAND.primary}" style="background-color:${BRAND.primary}; border-radius:10px;">
          <a href="${url}" style="display:inline-block; padding:14px 28px; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none;">
            Choose a New Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.5; color:#666;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${url}" style="color:${BRAND.primary}; word-break:break-all;">${url}</a>
    </p>
    <p style="margin:16px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#999;">If you didn't ask to reset your password, you can ignore this email. Your password won't change.</p>
  `;

  return renderEmailLayout({
    preheader: 'Choose a new password for your Heravote account.',
    bodyHtml,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Standalone layout (doesn't route through renderEmailLayout) -- a ballot
// receipt is a document, not a single-CTA notice: it needs the election's own
// mark up top rather than the Heravote wordmark, and a line-item list of
// selections the generic narrow layout has no room for. Every dynamic string
// is user- or admin-authored (voter name, election title, candidate/position
// names), so all of it is escaped before it reaches the markup.
const RECEIPT_PALETTE = {
  paper: '#eef0f6',
  card: '#ffffff',
  navy: '#0a192a',
  ink: '#18181b',
  slate: '#52525b',
  mist: '#f6f6f9',
  hairline: '#e7e7ee',
  purple: '#6d28d9',
  selected: '#0f9d58',
  abstained: '#b45309',
};

export function voteReceiptEmailHtml(params: {
  voterName: string;
  electionTitle: string;
  electionLogoUrl?: string | null;
  selections: { position: string; candidate: string; candidateImageUrl?: string | null; isAbstain: boolean }[];
  castAt: string;
  ip: string;
}): string {
  const c = RECEIPT_PALETTE;
  const voterName = escapeHtml(params.voterName || 'Voter');
  const electionTitle = escapeHtml(params.electionTitle);

  const selectionRows = params.selections.map((s) => {
    const position = escapeHtml(s.position);
    const candidate = escapeHtml(s.candidate);
    const thumb = s.candidateImageUrl
      ? `<img src="${escapeHtml(s.candidateImageUrl)}" width="56" height="56" alt="${candidate}" style="display:block; width:56px; height:56px; border-radius:10px; object-fit:cover; background-color:${c.mist};" />`
      : `<div style="width:56px; height:56px; border-radius:10px; background-color:${c.mist}; text-align:center; line-height:56px; font-family:Arial, Helvetica, sans-serif; font-size:20px; color:${s.isAbstain ? c.abstained : c.slate};">${s.isAbstain ? '—' : candidate.charAt(0).toUpperCase()}</div>`;
    const badgeColor = s.isAbstain ? c.abstained : c.selected;
    const badgeLabel = s.isAbstain ? 'Abstained' : 'Selected';

    return `
      <tr>
        <td style="padding:14px 0; border-bottom:1px solid ${c.hairline};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="56" valign="middle" style="padding-right:14px;">${thumb}</td>
              <td valign="middle">
                <p style="margin:0 0 3px; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:700; color:${c.ink};">${candidate}</p>
                <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:${c.slate};">${position}</p>
              </td>
              <td align="right" valign="middle" style="white-space:nowrap;">
                <span style="display:inline-block; font-family:Arial, Helvetica, sans-serif; font-size:10px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase; color:#ffffff; background-color:${badgeColor}; padding:6px 12px; border-radius:999px;">${badgeLabel}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join('');

  const logoBlock = params.electionLogoUrl
    ? `<img src="${escapeHtml(params.electionLogoUrl)}" alt="${electionTitle}" width="72" height="72" style="display:block; width:72px; height:72px; border-radius:16px; object-fit:cover; margin:0 auto;" />`
    : `<div style="width:72px; height:72px; border-radius:16px; background-color:${c.navy}; margin:0 auto; text-align:center; line-height:72px; font-family:Arial, Helvetica, sans-serif; font-size:26px; font-weight:800; color:#ffffff;">${electionTitle.charAt(0).toUpperCase()}</div>`;

  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${electionTitle} — Ballot Receipt</title>
  </head>
  <body style="margin:0; padding:0; background-color:${c.paper};">
    <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; opacity:0;">Your ballot receipt for ${electionTitle}.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.paper};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:${c.card}; border-radius:20px; overflow:hidden; box-shadow:0 2px 14px rgba(10,25,42,0.08);">

            <tr>
              <td align="center" style="padding:36px 32px 4px;">
                ${logoBlock}
                <p style="margin:14px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:${c.purple};">Ballot Receipt</p>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 32px 0;">
                <p style="margin:18px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:${c.slate};">Dear ${voterName},</p>
                <h1 style="margin:8px 0 14px; font-family:Arial, Helvetica, sans-serif; font-size:24px; font-weight:800; color:${c.ink}; text-wrap:balance;">Your vote has been cast</h1>
                <p style="margin:0 0 4px; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:${c.slate};">Your ballot for <strong style="color:${c.ink};">${electionTitle}</strong> was recorded successfully. Here is a copy of your selections for your records.</p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 32px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${selectionRows}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.mist}; border-radius:12px;">
                  <tr>
                    <td style="padding:14px 18px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase; color:${c.slate};">Cast at</td>
                          <td align="right" style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:${c.ink};">${escapeHtml(params.castAt)}</td>
                        </tr>
                        <tr>
                          <td style="padding-top:6px; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase; color:${c.slate};">IP address</td>
                          <td align="right" style="padding-top:6px; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:${c.ink}; font-variant-numeric:tabular-nums;">${escapeHtml(params.ip)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:11px; line-height:1.6; color:#a1a1aa;">If you didn't cast this ballot, contact your election administrator immediately.</p>
              </td>
            </tr>

            <tr>
              <td style="background-color:${c.navy}; padding:20px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:800; letter-spacing:0.6px; color:#ffffff;">HERAVOTE</td>
                    <td align="right" style="font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#8b93a3;">&copy; ${year} Heravote</td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
