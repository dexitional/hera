import { describe, expect, it } from 'vitest'
import { canonicalCode, generateNomineeCode, NOMINEE_CODE_LENGTH } from './nominee-access'

describe('nominee access codes', () => {
  it('are 8 characters from an alphabet without look-alikes', () => {
    const codes = Array.from({ length: 500 }, generateNomineeCode)
    for (const c of codes) expect(c).toMatch(new RegExp(`^[A-HJKMNP-Z2-9]{${NOMINEE_CODE_LENGTH}}$`))
    expect(new Set(codes).size).toBe(codes.length)
  })
  it('accept what a nominee types in any case, with spaces or dashes', () => {
    expect(canonicalCode(' k7qm-4xrp ')).toBe('K7QM4XRP')
    expect(canonicalCode(undefined)).toBe('')
  })
})
