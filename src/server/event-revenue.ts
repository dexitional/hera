// Event revenue maths, shared by the revenue/withdrawal server functions and
// the event console. Pure functions (no DB access) so they can be unit-tested.
//
//   gross          = sum of successful vote payments
//   fee            = gross x platformFeePercent / 100   (rounded to the pesewa)
//   organiserShare = gross - fee
//   withdrawn      = sum of non-voided withdrawals
//   balance        = organiserShare - withdrawn          (what can still be paid out)

export const WITHDRAWAL_METHODS = ['bank_transfer', 'mobile_money', 'cash', 'cheque', 'other'] as const;
export type WithdrawalMethod = (typeof WITHDRAWAL_METHODS)[number];

export const WITHDRAWAL_METHOD_LABELS: Record<WithdrawalMethod, string> = {
  bank_transfer: 'Bank transfer',
  mobile_money: 'Mobile money',
  cash: 'Cash',
  cheque: 'Cheque',
  other: 'Other',
};

/** Round to 2 decimal places (pesewas), avoiding binary float artefacts like 0.1 + 0.2. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type RevenueSummary = {
  gross: number;
  feePercent: number;
  fee: number;
  organiserShare: number;
  withdrawn: number;
  balance: number;
};

export function computeRevenue(input: { gross: number; feePercent: number; withdrawn: number }): RevenueSummary {
  const gross = round2(Math.max(0, Number(input.gross) || 0));
  const feePercent = Math.min(100, Math.max(0, Number(input.feePercent) || 0));
  const fee = round2((gross * feePercent) / 100);
  const organiserShare = round2(gross - fee);
  const withdrawn = round2(Math.max(0, Number(input.withdrawn) || 0));
  return { gross, feePercent, fee, organiserShare, withdrawn, balance: round2(organiserShare - withdrawn) };
}

export class RevenueValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RevenueValidationError';
  }
}

/** Validates a fee percentage: a number from 0 to 100 with at most 2 decimals. */
export function parseFeePercent(value: unknown): number {
  // Number(null) and Number('') are 0 -- a missing fee must not silently become 0%.
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    throw new RevenueValidationError('Enter a fee percentage.');
  }
  const n = typeof value === 'string' ? Number(value.trim()) : Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new RevenueValidationError('Fee must be a percentage between 0 and 100.');
  if (round2(n) !== n) throw new RevenueValidationError('Fee can have at most 2 decimal places.');
  return n;
}

export type WithdrawalInput = {
  amount: number;
  method: WithdrawalMethod;
  recipient: string | null;
  reference: string | null;
  note: string | null;
  paidAt: Date;
};

const cleanText = (value: unknown, max: number, field: string): string | null => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (text.length > max) throw new RevenueValidationError(`${field} must be at most ${max} characters.`);
  return text;
};

/** Validates and normalises a withdrawal from untrusted input. */
export function parseWithdrawalInput(raw: any, now: Date = new Date()): WithdrawalInput {
  const amount = typeof raw?.amount === 'string' ? Number(raw.amount.trim()) : Number(raw?.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new RevenueValidationError('Enter an amount greater than zero.');
  if (round2(amount) !== amount) throw new RevenueValidationError('Amount can have at most 2 decimal places.');
  if (amount > 1_000_000_000) throw new RevenueValidationError('Amount is too large.');

  const method = raw?.method;
  if (!WITHDRAWAL_METHODS.includes(method)) throw new RevenueValidationError('Choose how the money was paid out.');

  const paidAt = raw?.paidAt ? new Date(raw.paidAt) : now;
  if (Number.isNaN(paidAt.getTime())) throw new RevenueValidationError('Enter a valid payout date.');
  // Allow a small clock-skew margin, but not future-dated payouts.
  if (paidAt.getTime() > now.getTime() + 5 * 60 * 1000) throw new RevenueValidationError('Payout date cannot be in the future.');

  return {
    amount,
    method,
    recipient: cleanText(raw?.recipient, 120, 'Recipient'),
    reference: cleanText(raw?.reference, 120, 'Reference'),
    note: cleanText(raw?.note, 500, 'Note'),
    paidAt,
  };
}

/** Validates the reason for voiding a withdrawal (required, for the audit trail). */
export function parseVoidReason(value: unknown): string {
  const reason = String(value ?? '').trim();
  if (reason.length < 3) throw new RevenueValidationError('Give a reason for cancelling this withdrawal.');
  if (reason.length > 500) throw new RevenueValidationError('Reason must be at most 500 characters.');
  return reason;
}
