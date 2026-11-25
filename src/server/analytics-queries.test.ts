import { describe, expect, it } from 'vitest';
import { dayKeys, maskContact, percentChange, periodStart } from './analytics-queries';

const now = new Date('2026-11-25T15:30:00Z');

describe('periodStart', () => {
  it('"last 7 days" starts at UTC midnight 6 days before today', () => {
    expect(periodStart(7, now).toISOString()).toBe('2026-11-19T00:00:00.000Z');
  });
  it('"last 30 days" crosses month boundaries', () => {
    expect(periodStart(30, now).toISOString()).toBe('2026-10-27T00:00:00.000Z');
  });
});

describe('dayKeys', () => {
  it('lists every day from the start through today, inclusive', () => {
    const keys = dayKeys(periodStart(7, now), now);
    expect(keys).toEqual(['2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25']);
  });
  it('has exactly N entries for an N-day period', () => {
    expect(dayKeys(periodStart(90, now), now)).toHaveLength(90);
  });
});

describe('maskContact', () => {
  it('keeps only the last 3 digits of a phone number', () => {
    expect(maskContact('0241234567')).toBe('•••567');
  });
  it('keeps the first letter and domain of an email', () => {
    expect(maskContact('ama.mensah@gmail.com')).toBe('a•••@gmail.com');
  });
  it('shows a dash for missing values', () => {
    expect(maskContact(null)).toBe('—');
    expect(maskContact('unknown')).toBe('—');
  });
});

describe('percentChange', () => {
  it('measures growth and decline against the previous period', () => {
    expect(percentChange(150, 100)).toBe(50)
    expect(percentChange(50, 100)).toBe(-50)
  })
  it('is 0 when both periods are empty and null when only the previous one is', () => {
    expect(percentChange(0, 0)).toBe(0)
    expect(percentChange(10, 0)).toBeNull()
  })
})
