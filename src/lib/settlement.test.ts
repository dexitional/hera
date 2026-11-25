import { describe, expect, it } from 'vitest'
import { describeSettlement, parseSettlement } from './settlement'

describe('parseSettlement', () => {
  it('no type clears every field (settlement not set yet)', () => {
    expect(parseSettlement({ settlementType: '', settlementAccountNumber: '123' })).toEqual({
      settlementType: null, settlementProvider: null, settlementBranch: null, settlementAccountNumber: null, settlementAccountName: null,
    })
  })
  it('normalises a mobile money wallet', () => {
    expect(parseSettlement({ settlementType: 'momo', settlementProvider: 'mtn', settlementAccountNumber: '+233 24 123 4567', settlementAccountName: '  Ama   Mensah ', settlementBranch: 'ignored' }))
      .toEqual({ settlementType: 'momo', settlementProvider: 'MTN', settlementBranch: null, settlementAccountNumber: '0241234567', settlementAccountName: 'Ama Mensah' })
  })
  it('rejects an incomplete or invalid wallet', () => {
    expect(() => parseSettlement({ settlementType: 'momo', settlementAccountNumber: '0241234567', settlementAccountName: 'Ama' })).toThrow(/network/)
    expect(() => parseSettlement({ settlementType: 'momo', settlementProvider: 'Telecel', settlementAccountNumber: '+447700900123', settlementAccountName: 'Ama' })).toThrow(/Ghana mobile money number/)
    expect(() => parseSettlement({ settlementType: 'momo', settlementProvider: 'Telecel', settlementAccountNumber: '0201234567', settlementAccountName: '' })).toThrow(/name/)
  })
  it('normalises a bank account', () => {
    expect(parseSettlement({ settlementType: 'bank', settlementProvider: 'GCB Bank', settlementBranch: '', settlementAccountNumber: '1234 5678-9012', settlementAccountName: 'Campus Awards Ltd' }))
      .toEqual({ settlementType: 'bank', settlementProvider: 'GCB Bank', settlementBranch: null, settlementAccountNumber: '123456789012', settlementAccountName: 'Campus Awards Ltd' })
  })
  it('rejects bad bank details and unknown types', () => {
    expect(() => parseSettlement({ settlementType: 'bank', settlementProvider: 'GCB', settlementAccountNumber: '12AB', settlementAccountName: 'X Ltd' })).toThrow(/account number/)
    expect(() => parseSettlement({ settlementType: 'crypto' })).toThrow(/mobile money or bank/)
  })
})

describe('describeSettlement', () => {
  it('summarises both types', () => {
    expect(describeSettlement({ settlementType: 'momo', settlementProvider: 'MTN', settlementAccountNumber: '0241234567', settlementAccountName: 'Ama' })).toBe('MTN MoMo · 0241234567 · Ama')
    expect(describeSettlement({ settlementType: 'bank', settlementProvider: 'GCB Bank', settlementBranch: 'Cape Coast', settlementAccountNumber: '123', settlementAccountName: 'X' })).toBe('GCB Bank, Cape Coast · 123 · X')
    expect(describeSettlement(null)).toBeNull()
  })
})
