import { beforeEach, describe, expect, it, vi } from 'vitest';

// Capture what the mailer is configured with and asked to send; nothing is sent.
const createTransport = vi.fn();
const sendMail = vi.fn();
const verify = vi.fn();
vi.mock('nodemailer', () => ({
  default: { createTransport: (...args: any[]) => { createTransport(...args); return { sendMail, verify }; } },
}));

async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const key of ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'GMAIL_FROM_ADDRESS', 'SMTP_FROM_NAME']) delete process.env[key];
  Object.assign(process.env, env);
  return import('./email');
}

beforeEach(() => {
  createTransport.mockReset();
  sendMail.mockReset().mockResolvedValue({ messageId: 'test' });
  verify.mockReset().mockResolvedValue(true);
});

const CREDS = { GMAIL_USER: 'heravote.mailer@gmail.com', GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' };

describe('sendEmail (Gmail SMTP)', () => {
  it('connects to smtp.gmail.com:465 over TLS with the app password (spaces stripped)', async () => {
    const { sendEmail } = await load(CREDS);
    await sendEmail({ to: 'ama@example.com', subject: 'Hi', html: '<p>Hello</p>' });
    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(createTransport.mock.calls[0][0]).toMatchObject({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: 'heravote.mailer@gmail.com', pass: 'abcdefghijklmnop' },
    });
  });

  it('sends from the Gmail account with the display name, plus a text part', async () => {
    const { sendEmail } = await load({ ...CREDS, SMTP_FROM_NAME: 'Heravote' });
    await sendEmail({ to: 'ama@example.com', subject: 'Verify', html: '<p>Hello &amp; welcome</p>' });
    expect(sendMail).toHaveBeenCalledWith({
      from: { name: 'Heravote', address: 'heravote.mailer@gmail.com' },
      to: 'ama@example.com',
      subject: 'Verify',
      html: '<p>Hello &amp; welcome</p>',
      text: 'Hello & welcome',
    });
  });

  it('uses GMAIL_FROM_ADDRESS when a "Send mail as" alias is configured', async () => {
    const { sendEmail } = await load({ ...CREDS, GMAIL_FROM_ADDRESS: 'noreply@heravote.com' });
    await sendEmail({ to: 'ama@example.com', subject: 'x', html: '<p>x</p>' });
    expect(sendMail.mock.calls[0][0].from).toEqual({ name: 'Heravote', address: 'noreply@heravote.com' });
  });

  it('reuses one pooled transport across sends', async () => {
    const { sendEmail } = await load(CREDS);
    await sendEmail({ to: 'a@example.com', subject: 'x', html: 'x' });
    await sendEmail({ to: 'b@example.com', subject: 'x', html: 'x' });
    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(createTransport.mock.calls[0][0]).toMatchObject({ pool: true });
  });

  it('throws a clear error when credentials are missing', async () => {
    const { sendEmail } = await load({ GMAIL_USER: 'heravote.mailer@gmail.com' });
    await expect(sendEmail({ to: 'a@example.com', subject: 'x', html: 'x' })).rejects.toThrow(/GMAIL_USER and GMAIL_APP_PASSWORD must be configured/);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('throws (with a credentials hint) when Gmail rejects the login', async () => {
    sendMail.mockRejectedValueOnce(Object.assign(new Error('Invalid login: 535-5.7.8 Username and Password not accepted'), { code: 'EAUTH' }));
    const { sendEmail } = await load(CREDS);
    await expect(sendEmail({ to: 'a@example.com', subject: 'x', html: 'x' })).rejects.toThrow(/check GMAIL_USER \/ GMAIL_APP_PASSWORD.*535/);
  });

  it('verifyEmailTransport checks the SMTP login without sending', async () => {
    const { verifyEmailTransport } = await load(CREDS);
    await verifyEmailTransport();
    expect(verify).toHaveBeenCalledTimes(1);
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe('htmlToText', () => {
  it('turns the password reset email into readable text with the link kept', async () => {
    const { htmlToText, passwordResetEmailHtml } = await load(CREDS);
    const text = htmlToText(passwordResetEmailHtml({ name: 'Ama <Admin>', url: 'https://heravote.com/api/auth/reset-password/abc?callbackURL=%2Fauth%2Freset-password' }));
    expect(text).toContain('Hi Ama <Admin>,');
    expect(text).toContain('Choose a New Password (https://heravote.com/api/auth/reset-password/abc?callbackURL=%2Fauth%2Freset-password)');
    // No markup left behind (the literal "<Admin>" in the name is real text, not a tag).
    expect(text).not.toMatch(/<\/?(table|tr|td|a|p|h2|img|div|br|span)\b/i);
  });
});
