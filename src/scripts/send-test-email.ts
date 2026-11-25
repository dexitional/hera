// Checks the Gmail SMTP setup (GMAIL_USER / GMAIL_APP_PASSWORD).
//
//   npx tsx --env-file=.env src/scripts/send-test-email.ts              # log in only
//   npx tsx --env-file=.env src/scripts/send-test-email.ts you@x.com    # log in + send

import { sendEmail, verifyEmailTransport } from '../server/email.ts';

const to = process.argv[2];

try {
  await verifyEmailTransport();
  console.log(`Gmail login OK for ${process.env.GMAIL_USER}.`);
  if (to) {
    await sendEmail({
      to,
      subject: 'Heravote test email',
      html: '<p>This is a test email from Heravote. If you can read it, Gmail SMTP is configured correctly.</p>',
    });
    console.log(`Test email sent to ${to}.`);
  }
  process.exit(0);
} catch (err: any) {
  console.error('Email check failed:', err?.message ?? err);
  if (err?.code === 'EAUTH') {
    console.error('Use a Google App Password (16 characters), not the account password; 2-Step Verification must be on.');
  }
  process.exit(1);
}
