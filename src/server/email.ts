import nodemailer from 'nodemailer';

// Kept as the sole plain export in this module (not mixed alongside
// createServerFn exports) -- see paystack-credit.ts's comment for why that
// matters. Safe to import at top-level from src/lib/auth.ts (a plain config
// module, not a raw route file) the same way db/pg already is.
let transporter: ReturnType<typeof nodemailer.createTransport> | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !port || !user || !pass) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.error('sendEmail: SMTP not configured (SMTP_HOST/PORT/USER/PASSWORD missing in .env), skipping send.');
    return;
  }

  const fromName = process.env.SMTP_FROM_NAME || 'Heravote.com';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  await t.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
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
