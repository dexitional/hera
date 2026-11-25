import { describe, expect, it } from 'vitest';
import { computeRevenue, parseFeePercent, parseVoidReason, parseWithdrawalInput, RevenueValidationError, round2 } from './event-revenue';

describe('round2', () => {
  it('rounds to the pesewa without float artefacts', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(1.005)).toBe(1.01);
    expect(round2(66550.505)).toBe(66550.51);
  });
});

describe('computeRevenue', () => {
  it('splits gross into fee and organiser share, then subtracts withdrawals', () => {
    expect(computeRevenue({ gross: 1000, feePercent: 10, withdrawn: 250 })).toEqual({
      gross: 1000, feePercent: 10, fee: 100, organiserShare: 900, withdrawn: 250, balance: 650,
    });
  });

  it('keeps pesewas (the old ::int sums dropped them)', () => {
    const r = computeRevenue({ gross: 12.5, feePercent: 10, withdrawn: 0 });
    expect(r.fee).toBe(1.25);
    expect(r.organiserShare).toBe(11.25);
  });

  it('rounds fractional fees to the pesewa', () => {
    expect(computeRevenue({ gross: 33.33, feePercent: 7.5, withdrawn: 0 }).fee).toBe(2.5); // 2.49975 -> 2.50
  });

  it('handles 0% and 100% fees', () => {
    expect(computeRevenue({ gross: 500, feePercent: 0, withdrawn: 0 }).organiserShare).toBe(500);
    expect(computeRevenue({ gross: 500, feePercent: 100, withdrawn: 0 }).organiserShare).toBe(0);
  });

  it('clamps out-of-range / missing inputs', () => {
    expect(computeRevenue({ gross: -5, feePercent: 150, withdrawn: NaN })).toEqual({
      gross: 0, feePercent: 100, fee: 0, organiserShare: 0, withdrawn: 0, balance: 0,
    });
  });

  it('can report a negative balance if withdrawals exceed the share (callers block this)', () => {
    expect(computeRevenue({ gross: 100, feePercent: 50, withdrawn: 60 }).balance).toBe(-10);
  });
});

describe('parseFeePercent', () => {
  it.each([[0, 0], [10, 10], ['12.5', 12.5], [100, 100]])('accepts %p', (input, expected) => {
    expect(parseFeePercent(input)).toBe(expected);
  });
  it.each([-1, 100.01, 'abc', NaN, 10.555, null])('rejects %p', (input) => {
    expect(() => parseFeePercent(input)).toThrow(RevenueValidationError);
  });
});

describe('parseWithdrawalInput', () => {
  const now = new Date('2026-11-25T12:00:00Z');
  const base = { amount: 150, method: 'mobile_money', paidAt: '2026-11-24T10:00:00Z' };

  it('accepts a valid withdrawal and trims optional text', () => {
    const w = parseWithdrawalInput({ ...base, recipient: '  0241234567 ', reference: ' TX-99 ', note: '' }, now);
    expect(w).toMatchObject({ amount: 150, method: 'mobile_money', recipient: '0241234567', reference: 'TX-99', note: null });
    expect(w.paidAt.toISOString()).toBe('2026-11-24T10:00:00.000Z');
  });

  it('defaults the payout date to now', () => {
    expect(parseWithdrawalInput({ amount: 10, method: 'cash' }, now).paidAt).toEqual(now);
  });

  it.each([
    ['zero amount', { ...base, amount: 0 }],
    ['negative amount', { ...base, amount: -5 }],
    ['three decimals', { ...base, amount: 10.555 }],
    ['non-numeric amount', { ...base, amount: 'ten' }],
    ['unknown method', { ...base, method: 'crypto' }],
    ['invalid date', { ...base, paidAt: 'not-a-date' }],
    ['future date', { ...base, paidAt: '2026-11-26T12:00:00Z' }],
    ['over-long note', { ...base, note: 'x'.repeat(501) }],
  ])('rejects %s', (_label, input) => {
    expect(() => parseWithdrawalInput(input, now)).toThrow(RevenueValidationError);
  });
});

describe('parseVoidReason', () => {
  it('requires a meaningful reason', () => {
    expect(parseVoidReason('  Duplicate entry ')).toBe('Duplicate entry');
    expect(() => parseVoidReason('')).toThrow(RevenueValidationError);
    expect(() => parseVoidReason('no')).toThrow(RevenueValidationError);
  });
});
