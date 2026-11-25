// Who paid, as Paystack reports it, for the pay_phone column of a web vote.
//
// Mobile money payments carry the payer's wallet number in
// authorization.mobile_money_number (e.g. "0551234987"). Card payments have no
// phone at all (customer.phone is empty because checkout only collects an
// email), so they are recorded by card instead: "VISA ••••4081".

const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** `data` is the `data` object of Paystack's verify response or charge.success webhook. */
export function paystackPayerContact(data: any): string {
  const phone =
    clean(data?.authorization?.mobile_money_number) ||
    clean(data?.customer?.international_format_phone) ||
    clean(data?.customer?.phone) ||
    clean(data?.metadata?.phone);
  if (phone) return phone;

  const last4 = clean(data?.authorization?.last4);
  if (last4) {
    const brand = clean(data?.authorization?.brand) || clean(data?.authorization?.card_type) || 'card';
    return `${brand.toUpperCase()} ••••${last4}`;
  }
  return 'unknown';
}
