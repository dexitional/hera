import { describe, expect, it } from 'vitest'
import { maskPhone, normalizePhone, toSmsRecipient } from './phone'

describe('normalizePhone', () => {
  it('stores every way of typing a Ghana number the same way', () => {
    for (const v of ['0241234567', '024 123 4567', '024-123-4567', '+233241234567', '+233 24 123 4567', '233241234567', '00233241234567', '241234567']) {
      expect(normalizePhone(v), v).toBe('0241234567')
    }
  })
  it('keeps other international numbers with a plus', () => {
    expect(normalizePhone('+44 7700 900123')).toBe('+447700900123')
  })
  it('rejects what is not a phone number', () => {
    for (const v of ['', '   ', 'abc', '12345', '024123456789', null, undefined]) expect(normalizePhone(v), String(v)).toBeNull()
  })
})

describe('toSmsRecipient / maskPhone', () => {
  it('converts to the gateway format and masks for display', () => {
    expect(toSmsRecipient('0241234567')).toBe('233241234567')
    expect(toSmsRecipient('+447700900123')).toBe('447700900123')
    expect(maskPhone('0241234567')).toBe('•••• 567')
    expect(maskPhone(null)).toBe('')
  })
})
