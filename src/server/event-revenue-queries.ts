import { and, count, desc, eq, inArray, isNull, max, sql, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../db';
import { categories, contestants, events, eventTransactions, eventWithdrawals, user } from '../db/schema';
import { computeRevenue, type RevenueSummary } from './event-revenue';

// Revenue aggregation queries. Kept out of the createServerFn modules for the
// client-bundle stripping reason documented in paystack-credit.ts.
// `executor` is the db or a transaction (so balance checks can run under the
// same lock as the write they guard).

type Executor = typeof db | any;

export type EventCollections = { gross: number; payments: number; votes: number; lastPaymentAt: Date | null };

/** Successful vote payments per event, in one grouped query. */
export async function loadCollectionsByEvent(executor: Executor, eventIds?: string[]): Promise<Map<string, EventCollections>> {
  if (eventIds && eventIds.length === 0) return new Map();
  const rows = await executor
    .select({
      eventId: categories.eventId,
      // float8, not ::int -- the old ::int casts truncated pesewas (GHS 0.50 votes).
      gross: sql<number>`coalesce(sum(${eventTransactions.payAmount}), 0)::float8`,
      payments: count(),
      votes: sql<number>`coalesce(sum(${eventTransactions.votes}), 0)::int`,
      lastPaymentAt: max(eventTransactions.createdAt),
    })
    .from(eventTransactions)
    .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
    .innerJoin(categories, eq(contestants.categoryId, categories.id))
    .where(and(eq(eventTransactions.payStatus, true), eventIds ? inArray(categories.eventId, eventIds) : undefined))
    .groupBy(categories.eventId);

  return new Map(
    rows.map((r: any) => [r.eventId, { gross: Number(r.gross), payments: Number(r.payments), votes: Number(r.votes), lastPaymentAt: r.lastPaymentAt ?? null }]),
  );
}

/** Non-voided withdrawals per event, in one grouped query. */
export async function loadWithdrawnByEvent(executor: Executor, eventIds?: string[]): Promise<Map<string, number>> {
  if (eventIds && eventIds.length === 0) return new Map();
  const rows = await executor
    .select({ eventId: eventWithdrawals.eventId, withdrawn: sql<number>`coalesce(${sum(eventWithdrawals.amount)}, 0)::float8` })
    .from(eventWithdrawals)
    .where(and(isNull(eventWithdrawals.voidedAt), eventIds ? inArray(eventWithdrawals.eventId, eventIds) : undefined))
    .groupBy(eventWithdrawals.eventId);

  return new Map(rows.map((r: any) => [r.eventId, Number(r.withdrawn)]));
}

const recordedByUser = alias(user, 'recorded_by_user');
const voidedByUser = alias(user, 'voided_by_user');

/** Every withdrawal for an event (voided ones included), newest payout first. */
export async function loadWithdrawalLedger(executor: Executor, eventId: string) {
  const rows = await executor
    .select({
      id: eventWithdrawals.id,
      amount: eventWithdrawals.amount,
      method: eventWithdrawals.method,
      recipient: eventWithdrawals.recipient,
      reference: eventWithdrawals.reference,
      note: eventWithdrawals.note,
      paidAt: eventWithdrawals.paidAt,
      createdAt: eventWithdrawals.createdAt,
      voidedAt: eventWithdrawals.voidedAt,
      voidReason: eventWithdrawals.voidReason,
      recordedByName: recordedByUser.name,
      voidedByName: voidedByUser.name,
    })
    .from(eventWithdrawals)
    .leftJoin(recordedByUser, eq(eventWithdrawals.recordedBy, recordedByUser.id))
    .leftJoin(voidedByUser, eq(eventWithdrawals.voidedBy, voidedByUser.id))
    .where(eq(eventWithdrawals.eventId, eventId))
    .orderBy(desc(eventWithdrawals.paidAt), desc(eventWithdrawals.createdAt));
  return rows.map((w: any) => ({
    ...w,
    amount: Number(w.amount),
    paidAt: w.paidAt.toISOString(),
    createdAt: w.createdAt.toISOString(),
    voidedAt: w.voidedAt ? w.voidedAt.toISOString() : null,
  }));
}

/**
 * Locks the event row (SELECT ... FOR UPDATE) and returns its current revenue
 * -- optionally re-computed with a proposed fee %. Call inside a transaction
 * so concurrent fee changes / withdrawals for the same event are serialised
 * and a balance check can't be raced.
 */
export async function lockEventRevenue(tx: Executor, eventId: string, feePercentOverride?: number): Promise<RevenueSummary> {
  const [event] = await tx
    .select({ id: events.id, platformFeePercent: events.platformFeePercent })
    .from(events)
    .where(eq(events.id, eventId))
    .for('update');
  if (!event) throw new Error('Event not found.');
  const [collections, withdrawn] = await Promise.all([loadCollectionsByEvent(tx, [eventId]), loadWithdrawnByEvent(tx, [eventId])]);
  return computeRevenue({
    gross: collections.get(eventId)?.gross ?? 0,
    feePercent: feePercentOverride ?? event.platformFeePercent,
    withdrawn: withdrawn.get(eventId) ?? 0,
  });
}
