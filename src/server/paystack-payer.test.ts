import { describe, expect, it } from 'vitest';
import { paystackPayerContact } from './paystack-payer';

// Shapes taken from real Paystack test-mode verify responses.
const momo = {
  channel: 'mobile_money',
  customer: { email: 'voter-abc@heravote.com', phone: '', international_format_phone: null },
  authorization: { channel: 'mobile_money', last4: 'X987', brand: 'Mtn', bank: 'MTN', mobile_money_number: '0551234987' },
};
const card = {
  channel: 'card',
  customer: { email: 'voter-abc@heravote.com', phone: '', international_format_phone: null },
  authorization: { channel: 'card', last4: '4081', brand: 'visa', card_type: 'visa ' },
};

describe('paystackPayerContact', () => {
  it('records the mobile money number for MoMo payments', () => {
    expect(paystackPayerContact(momo)).toBe('0551234987');
  });
  it('falls back to the customer phone, then metadata phone', () => {
    expect(paystackPayerContact({ customer: { phone: ' 0241112223 ' } })).toBe('0241112223');
    expect(paystackPayerContact({ metadata: { phone: '233201234567' } })).toBe('233201234567');
  });
  it('records the card used when the payment has no phone', () => {
    expect(paystackPayerContact(card)).toBe('VISA ••••4081');
  });
  it('never records the checkout email or a placeholder', () => {
    expect(paystackPayerContact({ customer: { email: 'voter-x@heravote.com' } })).toBe('unknown');
    expect(paystackPayerContact(undefined)).toBe('unknown');
  });
});
