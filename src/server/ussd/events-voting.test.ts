import { beforeEach, describe, expect, it, vi } from 'vitest'

const nominee = {
  contestant: { id: 'c1', code: '23445', name: 'Ama Mensah' },
  category: { id: 'cat1', name: 'Best Dancer' },
  event: { id: 'e1', title: 'Campus Awards', unitPrice: 1, isActive: true },
}

// Every query in the module ends in .where(...) and is awaited there.
vi.mock('../../db', () => {
  const chain: any = {}
  for (const m of ['select', 'from', 'innerJoin', 'orderBy', 'limit']) chain[m] = () => chain
  chain.where = () => Promise.resolve([nominee])
  return { db: chain }
})
vi.mock('../../middleware/idempotency', () => ({
  guardTransaction: vi.fn(async () => ({ isAllowed: true })),
  releaseTransactionLock: vi.fn(async () => {}),
}))
vi.mock('../paystack-momo', () => ({ initiateMomoCharge: vi.fn(), submitMomoOtp: vi.fn() }))

import { initiateMomoCharge, submitMomoOtp } from '../paystack-momo'
import { handleEventsVotingStep } from './events-voting'

const charge = vi.mocked(initiateMomoCharge)
const submitOtp = vi.mocked(submitMomoOtp)
const phoneNumber = '233201234567'
const confirm = () =>
  handleEventsVotingStep({ state: { step: 'awaiting_confirm', code: '23445', voteCount: 5 }, latestInput: '1', phoneNumber })
const otpState = { step: 'awaiting_otp' as const, reference: 'ref_1', voteCount: 5, totalAmount: 5, attempts: 0 }

beforeEach(() => {
  charge.mockReset()
  submitOtp.mockReset()
})

describe('USSD mobile money charge', () => {
  it('keeps the session open for the Paystack SMS code instead of ending it', async () => {
    charge.mockResolvedValue({ reference: 'ref_1', status: 'send_otp', displayText: 'Please enter OTP' })
    const step = await confirm()
    expect(step.continueSession).toBe(true)
    expect(step.message).toMatch(/Enter the code to get your Mobile Money prompt \(GHS 5\.00\)/)
    expect(step.nextState).toEqual(otpState)
  })

  it('submits the code and then tells the voter to approve the prompt', async () => {
    submitOtp.mockResolvedValue({ reference: 'ref_1', status: 'pay_offline', displayText: 'Approve on your phone' })
    const step = await handleEventsVotingStep({ state: otpState, latestInput: ' 123 456 ', phoneNumber })
    expect(submitOtp).toHaveBeenCalledWith('ref_1', '123456')
    expect(step.continueSession).toBe(false)
    expect(step.message).toMatch(/^Approve the Mobile Money prompt to complete payment of GHS 5\.00 for 5 vote\(s\)/)
  })

  it('treats a pending reply from submit_otp as waiting for approval', async () => {
    submitOtp.mockResolvedValue({ reference: 'ref_1', status: 'pending', displayText: undefined })
    const step = await handleEventsVotingStep({ state: otpState, latestInput: '123456', phoneNumber })
    expect(step.message).toMatch(/^Approve the Mobile Money prompt/)
  })

  it('allows one retry for a rejected code, then ends the session', async () => {
    submitOtp.mockResolvedValue({ reference: 'ref_1', status: 'send_otp', displayText: 'Invalid OTP' })
    const first = await handleEventsVotingStep({ state: otpState, latestInput: '111111', phoneNumber })
    expect(first.continueSession).toBe(true)
    expect(first.nextState).toEqual({ ...otpState, attempts: 1 })
    const second = await handleEventsVotingStep({ state: first.nextState!, latestInput: '222222', phoneNumber })
    expect(second.continueSession).toBe(false)
    expect(second.message).toMatch(/not accepted/)
  })

  it('asks again for input that is not a code, without calling Paystack', async () => {
    const step = await handleEventsVotingStep({ state: otpState, latestInput: 'abc', phoneNumber })
    expect(submitOtp).not.toHaveBeenCalled()
    expect(step.continueSession).toBe(true)
    expect(step.nextState).toEqual({ ...otpState, attempts: 1 })
  })

  it('shows Paystack’s reason when the code step fails outright', async () => {
    submitOtp.mockResolvedValue({ reference: 'ref_1', status: 'failed', displayText: 'Transaction reference is invalid' })
    const step = await handleEventsVotingStep({ state: otpState, latestInput: '123456', phoneNumber })
    expect(step).toEqual({ message: 'Transaction reference is invalid', continueSession: false })
  })

  it('still ends with the approval message when no code is needed', async () => {
    charge.mockResolvedValue({ reference: 'ref_2', status: 'pay_offline', displayText: 'Approve' })
    const step = await confirm()
    expect(step.continueSession).toBe(false)
    expect(step.message).toMatch(/^Approve the Mobile Money prompt/)
  })
})
