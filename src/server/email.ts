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

  const fromName = process.env.SMTP_FROM_NAME || 'Heravote';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  await t.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export function verificationEmailHtml(params: { name: string; url: string }): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6d28d9;">Verify your Heravote account</h2>
      <p>Hi ${params.name},</p>
      <p>Thanks for signing up. Please confirm your email address to activate your account:</p>
      <p>
        <a href="${params.url}" style="display: inline-block; background: #6d28d9; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Verify Email Address
        </a>
      </p>
      <p style="color: #666; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:<br/>${params.url}</p>
      <p style="color: #999; font-size: 12px;">If you didn't create a Heravote account, you can safely ignore this email.</p>
    </div>
  `;
}
