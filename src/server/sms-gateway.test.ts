import { describe, expect, it } from 'vitest'
import { gatewayAccepted, toInternational, toLocalGhana } from './sms-gateway'

describe('phone formats per gateway', () => {
  it('international (Arkesel, SMSOnlineGH) and local (mNotify)', () => {
    for (const v of ['0241234567', '233241234567', '+233 24 123 4567', '00233241234567', '241234567']) {
      expect(toInternational(v), v).toBe('233241234567')
      expect(toLocalGhana(v), v).toBe('0241234567')
    }
  })
})

describe('gatewayAccepted', () => {
  it('reads each gateway’s success reply', () => {
    expect(gatewayAccepted('arkesel', true, { status: 'success', data: [] })).toBe(true)
    expect(gatewayAccepted('mnotify', true, { status: 'success', code: '2000' })).toBe(true)
    expect(gatewayAccepted('smsonlinegh', true, { handshake: { id: 0, label: 'HSHK_OK' } })).toBe(true)
  })
  it('treats errors, HTTP failures and unknown bodies as not sent', () => {
    expect(gatewayAccepted('arkesel', true, { status: 'error', message: 'Insufficient balance' })).toBe(false)
    expect(gatewayAccepted('mnotify', true, { status: 'error', code: '1005' })).toBe(false)
    expect(gatewayAccepted('smsonlinegh', true, { handshake: { id: 1401, label: 'HSHK_ERR_UA_AUTH' } })).toBe(false)
    expect(gatewayAccepted('mnotify', false, { status: 'success' })).toBe(false)
    expect(gatewayAccepted('arkesel', true, null)).toBe(false)
  })
})
