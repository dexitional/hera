import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { eventTransactions } from '../db/schema';

// Retiring payments Paystack has reversed: a processed refund, or a
// chargeback the merchant lost. The transaction keeps its row (audit trail)
// but gets pay_status = false, so its votes and revenue stop counting
// everywhere those are summed (tallies, dashboards, revenue, exports).
//
// Kept in its own module (not alongside createServerFn exports) and reached
// via dynamic import from the webhook route, for the client-bundle stripping
// reason documented in paystack-credit.ts.

export type Reversal = { reference: string; reason: string };

/**
 * The payment a webhook event reverses, or null when the event isn't a
 * completed reversal (pending/failed refunds, disputes still open or won).
 */
export function reversalFromEvent(event: any): Reversal | null {
  const type = String(event?.event ?? '');
  const data = event?.data ?? {};

  if (type === 'refund.processed') {
    const reference = data.transaction_reference ?? data.transaction?.reference;
    if (!reference) return null;
    const amount = Number(data.amount);
    const naira = Number.isFinite(amount) && amount > 0 ? ` of ${(amount / 100).toFixed(2)} ${data.currency ?? ''}`.trimEnd() : '';
    return { reference: String(reference), reason: `Refunded through Paystack${naira}${data.refund_reference ? ` (refund ${data.refund_reference})` : ''}.` };
  }

  if (type === 'charge.dispute.resolve') {
    // "declined" means the merchant won the dispute: the payment stands.
    const resolution = String(data.resolution ?? '').toLowerCase();
    if (!resolution || resolution === 'declined') return null;
    const reference = data.transaction?.reference ?? data.transaction_reference;
    if (!reference) return null;
    return { reference: String(reference), reason: `Chargeback resolved against the payment (${resolution}).` };
  }

  return null;
}

export type RetireResult = { status: 'retired'; transactionId: string } | { status: 'already_retired' | 'not_found' };

/** Marks the transaction with this Paystack reference as reversed. Idempotent. */
export async function retirePayment({ reference, reason }: Reversal): Promise<RetireResult> {
  const [updated] = await db
    .update(eventTransactions)
    .set({ payStatus: false, refundedAt: new Date(), refundReason: reason })
    .where(and(eq(eventTransactions.payRef, reference), isNull(eventTransactions.refundedAt)))
    .returning({ id: eventTransactions.id });
  if (updated) return { status: 'retired', transactionId: updated.id };

  const [existing] = await db
    .select({ id: eventTransactions.id })
    .from(eventTransactions)
    .where(eq(eventTransactions.payRef, reference));
  return { status: existing ? 'already_retired' : 'not_found' };
}
