// Phone number helpers shared by admin forms and the nominee portal.
//
// Ghana numbers are stored in local form ("0241234567") whichever way they
// were typed: "+233 24 123 4567", "233241234567", "024-123-4567". Other
// international numbers are kept as "+<digits>".

/** Normalised phone, or null when it isn't a plausible number. */
export function normalizePhone(input: unknown): string | null {
  const raw = String(input ?? '').trim();
  if (!raw) return null;
  const hasPlus = raw.startsWith('+') || raw.startsWith('00');
  let digits = raw.replace(/\D/g, '');
  if (raw.startsWith('00')) digits = digits.slice(2);

  if (digits.startsWith('233') && digits.length === 12) return `0${digits.slice(3)}`;
  if (!hasPlus && digits.length === 10 && digits.startsWith('0')) return digits;
  if (!hasPlus && digits.length === 9 && /^[235]/.test(digits)) return `0${digits}`;
  if (hasPlus && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

/** The international form an SMS gateway expects ("233241234567"). */
export function toSmsRecipient(phone: string): string {
  if (phone.startsWith('+')) return phone.slice(1);
  if (phone.startsWith('0')) return `233${phone.slice(1)}`;
  return phone;
}

/** "•••• 567" style mask for showing which number an SMS went to. */
export function maskPhone(phone: string | null | undefined): string {
  const p = String(phone ?? '');
  return p ? `•••• ${p.slice(-3)}` : '';
}
