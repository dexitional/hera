import { and, count, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { db } from '../db';
import { categories, contestants, elections, electionVotes, events, eventTransactions, voters, user } from '../db/schema';
import { electionOwnerScope, eventOwnerScope } from './access-control';

// Dashboard analytics queries, scoped by role: super admins see the whole
// platform, everyone else only their own events/elections. Kept out of the
// createServerFn modules for the client-bundle stripping reason documented in
// paystack-credit.ts.
//
// Days are bucketed in UTC, which is Ghana time (GMT, no daylight saving).

type Admin = { id: string; role?: string | null };

/** UTC midnight `days - 1` days ago, so "last 7 days" = today + the 6 days before. */
export function periodStart(days: number, now: Date = new Date()): Date {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

/** Every UTC date (YYYY-MM-DD) from start through today, for gap-free series. */
export function dayKeys(start: Date, now: Date = new Date()): string[] {
  const keys: string[] = [];
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (let t = start.getTime(); t <= end; t += 86_400_000) keys.push(new Date(t).toISOString().slice(0, 10));
  return keys;
}

/** Hides most of a payer's phone/email in lists: "•••567", "a•••@gmail.com". */
export function maskContact(value: string | null | undefined): string {
  const v = String(value ?? '').trim();
  if (!v || v === 'unknown') return '—';
  if (v.includes('@')) {
    const [local, domain] = v.split('@');
    return `${local.slice(0, 1)}•••@${domain}`;
  }
  return `•••${v.slice(-3)}`;
}

export async function loadScopedEvents(admin: Admin) {
  return db
    .select({
      id: events.id,
      title: events.title,
      isActive: events.isActive,
      platformFeePercent: events.platformFeePercent,
      ownerName: user.name,
      ownerOrganization: user.organization,
    })
    .from(events)
    .innerJoin(user, eq(events.adminId, user.id))
    .where(eventOwnerScope(admin));
}

/** Successful payments per (UTC day, event) from `since` up to (not including) `until`. */
export async function loadDailyCollections(eventIds: string[], since: Date, until?: Date) {
  if (eventIds.length === 0) return [];
  const day = sql<string>`to_char(date_trunc('day', ${eventTransactions.createdAt}), 'YYYY-MM-DD')`;
  return db
    .select({
      day,
      eventId: categories.eventId,
      gross: sql<number>`coalesce(sum(${eventTransactions.payAmount}), 0)::float8`,
      votes: sql<number>`coalesce(sum(${eventTransactions.votes}), 0)::int`,
      payments: count(),
    })
    .from(eventTransactions)
    .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
    .innerJoin(categories, eq(contestants.categoryId, categories.id))
    .where(and(
      eq(eventTransactions.payStatus, true),
      gte(eventTransactions.createdAt, since),
      until ? lt(eventTransactions.createdAt, until) : undefined,
      inArray(categories.eventId, eventIds),
    ))
    .groupBy(day, categories.eventId);
}

/** Collections by payment channel (WEB / USSD) since `since`. */
export async function loadChannelSplit(eventIds: string[], since: Date) {
  if (eventIds.length === 0) return [];
  return db
    .select({
      channel: eventTransactions.channel,
      gross: sql<number>`coalesce(sum(${eventTransactions.payAmount}), 0)::float8`,
      payments: count(),
    })
    .from(eventTransactions)
    .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
    .innerJoin(categories, eq(contestants.categoryId, categories.id))
    .where(and(eq(eventTransactions.payStatus, true), gte(eventTransactions.createdAt, since), inArray(categories.eventId, eventIds)))
    .groupBy(eventTransactions.channel);
}

export async function loadRecentPayments(eventIds: string[], limit = 10) {
  if (eventIds.length === 0) return [];
  const rows = await db
    .select({
      id: eventTransactions.id,
      createdAt: eventTransactions.createdAt,
      amount: eventTransactions.payAmount,
      votes: eventTransactions.votes,
      channel: eventTransactions.channel,
      payer: eventTransactions.payPhone,
      contestantName: contestants.name,
      eventId: categories.eventId,
      eventTitle: events.title,
    })
    .from(eventTransactions)
    .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
    .innerJoin(categories, eq(contestants.categoryId, categories.id))
    .innerJoin(events, eq(categories.eventId, events.id))
    .where(and(eq(eventTransactions.payStatus, true), inArray(categories.eventId, eventIds)))
    .orderBy(desc(eventTransactions.createdAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, amount: Number(r.amount) || 0, payer: maskContact(r.payer), createdAt: r.createdAt.toISOString() }));
}

export async function loadScopedElections(admin: Admin) {
  return db
    .select({
      id: elections.id,
      title: elections.title,
      tag: elections.tag,
      status: elections.status,
      startAt: elections.startAt,
      endAt: elections.endAt,
      ownerName: user.name,
      ownerOrganization: user.organization,
    })
    .from(elections)
    .innerJoin(user, eq(elections.adminId, user.id))
    .where(electionOwnerScope(admin));
}

/** Registered and voted counts per election. */
export async function loadTurnout(electionIds: string[]) {
  if (electionIds.length === 0) return new Map<string, { registered: number; voted: number }>();
  const rows = await db
    .select({
      electionId: voters.electionId,
      registered: count(),
      voted: sql<number>`count(*) filter (where ${voters.hasVoted})::int`,
    })
    .from(voters)
    .where(inArray(voters.electionId, electionIds))
    .groupBy(voters.electionId);
  return new Map(rows.map((r) => [r.electionId, { registered: Number(r.registered), voted: Number(r.voted) }]));
}

/**
 * Ballots cast per UTC day since `since`. A ballot's selections are inserted
 * in one statement and share its created_at, so distinct (election,
 * created_at) pairs count ballots, not individual position selections.
 */
export async function loadDailyBallots(electionIds: string[], since: Date, until?: Date) {
  if (electionIds.length === 0) return [];
  const day = sql<string>`to_char(date_trunc('day', ${electionVotes.createdAt}), 'YYYY-MM-DD')`;
  return db
    .select({ day, ballots: sql<number>`count(distinct (${electionVotes.electionId}, ${electionVotes.createdAt}))::int` })
    .from(electionVotes)
    .where(and(
      gte(electionVotes.createdAt, since),
      until ? lt(electionVotes.createdAt, until) : undefined,
      inArray(electionVotes.electionId, electionIds),
    ))
    .groupBy(day);
}

/** Account totals, plus sign-ups in [since, now) and in the equally long window before it. */
export async function countAccounts(since: Date, prevSince: Date) {
  // Raw sql params skip the column's Date mapping, so bind UTC ISO strings like drizzle does.
  const iso = (d: Date) => d.toISOString();
  const [row] = await db
    .select({
      total: count(),
      supers: sql<number>`count(*) filter (where ${user.role} = 'super')::int`,
      unverified: sql<number>`count(*) filter (where not ${user.emailVerified})::int`,
      disabled: sql<number>`count(*) filter (where ${user.banned})::int`,
      newInPeriod: sql<number>`count(*) filter (where ${user.createdAt} >= ${iso(since)})::int`,
      newInPrevious: sql<number>`count(*) filter (where ${user.createdAt} >= ${iso(prevSince)} and ${user.createdAt} < ${iso(since)})::int`,
    })
    .from(user);
  const num = (v: unknown) => Number(v ?? 0);
  return {
    total: num(row?.total),
    superAdmins: num(row?.supers),
    unverified: num(row?.unverified),
    disabled: num(row?.disabled),
    newInPeriod: num(row?.newInPeriod),
    newInPrevious: num(row?.newInPrevious),
  };
}

/** Percentage change from `previous` to `current`; null when there's no previous baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
