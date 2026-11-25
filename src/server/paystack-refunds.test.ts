import { describe, expect, it } from 'vitest'
import { reversalFromEvent } from './paystack-refunds'

describe('reversalFromEvent', () => {
  it('retires a processed refund by its transaction reference', () => {
    const r = reversalFromEvent({ event: 'refund.processed', data: { status: 'processed', transaction_reference: 'T604309277428543', amount: 2500, currency: 'GHS', refund_reference: 'RF-1' } })
    expect(r?.reference).toBe('T604309277428543')
    expect(r?.reason).toBe('Refunded through Paystack of 25.00 GHS (refund RF-1).')
  })
  it('ignores refunds that are only pending or failed, and other events', () => {
    expect(reversalFromEvent({ event: 'refund.pending', data: { transaction_reference: 'T1' } })).toBeNull()
    expect(reversalFromEvent({ event: 'refund.failed', data: { transaction_reference: 'T1' } })).toBeNull()
    expect(reversalFromEvent({ event: 'charge.success', data: { reference: 'T1' } })).toBeNull()
    expect(reversalFromEvent({ event: 'refund.processed', data: {} })).toBeNull()
  })
  it('retires chargebacks the merchant lost, not ones the merchant won', () => {
    expect(reversalFromEvent({ event: 'charge.dispute.resolve', data: { resolution: 'merchant-accepted', transaction: { reference: 'T2' } } })?.reference).toBe('T2')
    expect(reversalFromEvent({ event: 'charge.dispute.resolve', data: { resolution: 'declined', transaction: { reference: 'T2' } } })).toBeNull()
    expect(reversalFromEvent({ event: 'charge.dispute.create', data: { transaction: { reference: 'T2' } } })).toBeNull()
  })
})
