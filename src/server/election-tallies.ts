import { and, count, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { electionVotes } from '../db/schema';

// Kept in its own module (not alongside createServerFn exports) for the
// client-bundle stripping reason documented in paystack-credit.ts.

/**
 * Abstention (blank ballot) count for every position of an election, in ONE
 * grouped query. The results/telemetry functions previously ran a separate
 * COUNT per position inside a loop -- N+1 queries on every dashboard poll.
 * Positions with no abstentions are simply absent (treat as 0).
 */
export async function getAbstentionCountsByPosition(electionId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ positionId: electionVotes.positionId, total: count() })
    .from(electionVotes)
    .where(and(eq(electionVotes.electionId, electionId), isNull(electionVotes.candidateId)))
    .groupBy(electionVotes.positionId);

  return new Map(rows.map((r) => [r.positionId, Number(r.total)]));
}
