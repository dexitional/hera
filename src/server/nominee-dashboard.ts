import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db';
import { contestants, eventTransactions } from '../db/schema';
import { dayKeys, periodStart } from './analytics-queries';

// Data for a nominee's portal dashboard. Only paid transactions count as
// votes. Nothing here exposes voters' phone numbers or any money figures:
// nominees see votes, never revenue.
//
// Kept out of the createServerFn module for the client-bundle stripping
// reason documented in paystack-credit.ts.

export const NOMINEE_RESULTS_VIEWS = ['hidden', 'own', 'standings'] as const;
export type NomineeResultsView = (typeof NOMINEE_RESULTS_VIEWS)[number];

export function asResultsView(v: unknown): NomineeResultsView {
  return (NOMINEE_RESULTS_VIEWS as readonly unknown[]).includes(v) ? (v as NomineeResultsView) : 'own';
}

/** At most this many days in the trend chart. */
const MAX_TREND_DAYS = 60;

/**
 * Standard competition ranking ("1, 2, 2, 4"): a nominee's rank is one more
 * than the number of nominees with strictly more votes, so ties share a rank.
 */
export function rankStandings<T extends { id: string; votes: number }>(rows: T[]): (T & { rank: number })[] {
  const sorted = [...rows].sort((a, b) => b.votes - a.votes);
  return sorted.map((row) => ({ ...row, rank: 1 + sorted.filter((o) => o.votes > row.votes).length }));
}

/** Paid votes per nominee in one category, every nominee included (0 when none). */
export async function loadCategoryStandings(categoryId: string) {
  const rows = await db
    .select({
      id: contestants.id,
      name: contestants.name,
      imageUrl: contestants.imageUrl,
      code: contestants.code,
      votes: sql<number>`coalesce(sum(${eventTransactions.votes}) filter (where ${eventTransactions.payStatus}), 0)::int`,
    })
    .from(contestants)
    .leftJoin(eventTransactions, eq(eventTransactions.contestantId, contestants.id))
    .where(eq(contestants.categoryId, categoryId))
    .groupBy(contestants.id);
  return rankStandings(rows.map((r) => ({ ...r, votes: Number(r.votes) || 0 })));
}

/** The nominee's own figures: totals, a gap-free daily trend and recent votes. */
export async function loadOwnVotes(contestantId: string, eventStart: Date | null, now = new Date()) {
  // Trend window: from the event's start (or 14 days ago) up to today, capped.
  const startDays = eventStart ? Math.ceil((now.getTime() - eventStart.getTime()) / 86_400_000) + 1 : 14;
  const days = Math.min(MAX_TREND_DAYS, Math.max(7, startDays));
  const since = periodStart(days, now);
  const paid = and(eq(eventTransactions.contestantId, contestantId), eq(eventTransactions.payStatus, true));
  const day = sql<string>`to_char(date_trunc('day', ${eventTransactions.createdAt}), 'YYYY-MM-DD')`;

  const [[totals], daily, recent] = await Promise.all([
    db
      .select({
        total: sql<number>`coalesce(sum(${eventTransactions.votes}), 0)::int`,
        today: sql<number>`coalesce(sum(${eventTransactions.votes}) filter (where ${eventTransactions.createdAt} >= ${periodStart(1, now).toISOString()}), 0)::int`,
        week: sql<number>`coalesce(sum(${eventTransactions.votes}) filter (where ${eventTransactions.createdAt} >= ${periodStart(7, now).toISOString()}), 0)::int`,
        supporters: sql<number>`count(*)::int`,
      })
      .from(eventTransactions)
      .where(paid),
    db
      .select({ day, votes: sql<number>`coalesce(sum(${eventTransactions.votes}), 0)::int` })
      .from(eventTransactions)
      .where(and(paid, gte(eventTransactions.createdAt, since)))
      .groupBy(day),
    db
      .select({ createdAt: eventTransactions.createdAt, votes: eventTransactions.votes, channel: eventTransactions.channel })
      .from(eventTransactions)
      .where(paid)
      .orderBy(desc(eventTransactions.createdAt))
      .limit(10),
  ]);

  const byDay = new Map(daily.map((d) => [d.day, Number(d.votes) || 0]));
  return {
    total: Number(totals?.total) || 0,
    today: Number(totals?.today) || 0,
    week: Number(totals?.week) || 0,
    payments: Number(totals?.supporters) || 0,
    series: dayKeys(since, now).map((date) => ({ date, votes: byDay.get(date) ?? 0 })),
    recent: recent.map((r) => ({ at: r.createdAt.toISOString(), votes: r.votes, channel: r.channel === 'USSD' ? 'USSD' : 'Web' })),
  };
}
