import { createServerFn } from '@tanstack/react-start';
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { events, elections, eventTransactions, electionVotes, user } from '../db/schema';
import { arcjetMiddleware } from '#/middleware/arcjetMiddleware';

// Public, unauthenticated landing-page stats. Cheap aggregate counts only —
// safe to poll on an interval for the "live" homepage figures.
export const getHomepageStatsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware])
  .handler(async () => {
    const [
      [{ count: totalEvents }],
      [{ count: totalElections }],
      [{ count: eventTransactionCount }],
      [{ count: electionVoteCount }],
      [{ count: totalOrganizations }],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(${events.id})::int` }).from(events),
      db.select({ count: sql<number>`count(${elections.id})::int` }).from(elections),
      db.select({ count: sql<number>`count(${eventTransactions.id})::int` })
        .from(eventTransactions)
        .where(sql`${eventTransactions.payStatus} = true`),
      db.select({ count: sql<number>`count(${electionVotes.id})::int` }).from(electionVotes),
      db.select({ count: sql<number>`count(distinct ${user.organization})::int` })
        .from(user)
        .where(sql`${user.organization} is not null and ${user.organization} <> ''`),
    ]);

    return {
      totalEvents,
      totalElections,
      totalTransactions: eventTransactionCount + electionVoteCount,
      totalOrganizations,
    };
  });
