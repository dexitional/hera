import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { categories, contestants, events, eventTransactions } from '../db/schema';

// Kept in its own module (not alongside tenant-events.ts's createServerFn exports)
// so tenant-events.ts stays a uniform "every export is createServerFn" file --
// TanStack Start's compiler strips createServerFn handler bodies from the client
// bundle per-export; a plain function mixed into that file was observed to break
// stripping for the WHOLE file, leaking the db/pg driver (and Buffer/Node builtins
// it depends on) into client JS and crashing every page. This function is only
// ever reached via dynamic import() from the webhook route, or as a normal
// server-side call from within another createServerFn handler.

export type CreditCardVoteParams = {
  reference: string;
  contestantId: string;
  votes: number;
  payPhone?: string | null;
  // Amount actually paid, in kobo (Paystack's smallest currency unit). Optional --
  // callers that have already had the amount authoritatively confirmed (e.g. a
  // signed webhook payload) may omit this and pass skipAmountCheck instead.
  amountKobo?: number;
  // Skip the paid-amount-vs-expected-amount cross-check. Only safe when the amount
  // has already been verified by the caller (e.g. Paystack's own signed webhook body).
  skipAmountCheck?: boolean;
  transRef?: string | null;
  channel?: string;
};

export type CreditCardVoteResult =
  | { status: 'credited'; votes: number; amount: number; reference: string }
  | { status: 'already_recorded'; reference: string }
  | { status: 'not_found'; reference: string; reason: string }
  | { status: 'amount_mismatch'; reference: string };

// Shared crediting logic used by both the client-triggered verify path
// (verifyAndCastCardVoteFn, which independently re-checks with Paystack's verify
// API since it cannot trust the browser) and the Paystack webhook route (which is
// authenticated via HMAC signature on the payload itself, so it does not need to
// call Paystack's verify API again). Never throws for expected "nothing to do"
// outcomes (already recorded / nominee not found) -- those are represented in the
// return value so callers (especially the webhook) can decide their own HTTP
// response without treating them as errors. Genuine unexpected failures (e.g. a
// DB error) still throw and propagate to the caller.
export async function creditCardVote(params: CreditCardVoteParams): Promise<CreditCardVoteResult> {
  const { reference, contestantId, votes, payPhone, amountKobo, skipAmountCheck, transRef, channel } = params;

  // Cheap pre-check to short-circuit the common case (and avoid the join below)
  // without relying on it for correctness -- the real idempotency guarantee is
  // the unique index on event_transactions.pay_ref plus the ON CONFLICT DO
  // NOTHING insert further down, which is atomic even when this route and the
  // client's own verify call race for the same reference.
  const [existing] = await db
    .select({ id: eventTransactions.id })
    .from(eventTransactions)
    .where(eq<any>(eventTransactions.payRef, reference));
  if (existing) {
    return { status: 'already_recorded', reference };
  }

  const [row] = await db
    .select({ contestant: contestants, category: categories, event: events })
    .from(contestants)
    .innerJoin(categories, eq(contestants.categoryId, categories.id))
    .innerJoin(events, eq(categories.eventId, events.id))
    .where(and(eq<any>(contestants.id, contestantId), eq<any>(events.isActive, true)));

  if (!row) {
    return { status: 'not_found', reference, reason: 'Nominee not found or event is no longer active.' };
  }

  const unitPrice = row.event.unitPrice ?? 0;

  if (!skipAmountCheck) {
    const expectedAmountKobo = Math.round(unitPrice * Number(votes) * 100);
    if (amountKobo !== expectedAmountKobo) {
      return { status: 'amount_mismatch', reference };
    }
  }

  const payAmount = unitPrice * Number(votes);

  // Atomic idempotent insert: the unique index on pay_ref (partial, WHERE pay_ref
  // IS NOT NULL) means a second concurrent caller for the same reference conflicts
  // here and inserts nothing, rather than racing past a separate SELECT check.
  const [inserted] = await db
    .insert(eventTransactions)
    .values({
      contestantId,
      payAmount,
      payStatus: true,
      payRef: reference,
      payPhone: payPhone || 'unknown',
      transRef: transRef ?? null,
      votes: Number(votes),
      channel: channel || 'WEB',
    })
    .onConflictDoNothing({ target: eventTransactions.payRef, where: sql`${eventTransactions.payRef} is not null` })
    .returning({ id: eventTransactions.id });

  if (!inserted) {
    return { status: 'already_recorded', reference };
  }

  return {
    status: 'credited',
    votes: Number(votes),
    amount: payAmount,
    reference,
  };
}
