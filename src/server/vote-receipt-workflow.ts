import { eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { candidates, elections, positions, voters } from '../db/schema';
import { sendEmail, voteReceiptEmailHtml } from './email';

type CastSelection = { positionId: string; candidateId: string | null };

// Fire-and-forget after a successful castBallotServerFn commit -- never
// awaited by the caller, and every failure here is swallowed and logged
// rather than thrown, so a broken mail provider can never roll back or
// surface an error on an otherwise-successful vote. Scoped to authMode
// 'google' only: that's the one login mode where the voter's email on file
// is guaranteed to be a real, verified inbox rather than a placeholder like
// `${username}@vote.local` seeded by bulk import.
export async function runVoteReceiptWorkflow(params: {
  voterId: string;
  electionId: string;
  selections: CastSelection[];
  ip: string;
  castAt: string;
}): Promise<void> {
  try {
    const { voterId, electionId, selections, ip, castAt } = params;

    const [election] = await db.select().from(elections).where(eq(elections.id, electionId));
    if (!election || election.authMode?.toLowerCase() !== 'google') return;

    const [voter] = await db.select().from(voters).where(eq(voters.id, voterId));
    if (!voter?.email) return;

    const positionIds = selections.map((s) => s.positionId);
    const candidateIds = selections
      .map((s) => s.candidateId)
      .filter((id): id is string => !!id);

    const [positionRows, candidateRows] = await Promise.all([
      positionIds.length ? db.select().from(positions).where(inArray(positions.id, positionIds)) : Promise.resolve([]),
      candidateIds.length ? db.select().from(candidates).where(inArray(candidates.id, candidateIds)) : Promise.resolve([]),
    ]);

    const positionTitleById = new Map(positionRows.map((p) => [p.id, p.title]));
    const candidateNameById = new Map(candidateRows.map((c) => [c.id, c.name]));

    const selectionLines = selections.map((s) => ({
      position: positionTitleById.get(s.positionId) || 'Unknown Position',
      candidate: s.candidateId ? (candidateNameById.get(s.candidateId) || 'Unknown Candidate') : 'Abstained',
    }));

    await sendEmail({
      to: voter.email,
      subject: `Your ballot receipt -- ${election.title}`,
      html: voteReceiptEmailHtml({
        voterName: voter.name,
        electionTitle: election.title,
        selections: selectionLines,
        castAt: new Date(castAt).toUTCString(),
        ip,
      }),
    });
  } catch (err) {
    console.error('[VOTE RECEIPT WORKFLOW] failed to send receipt email:', err);
  }
}
