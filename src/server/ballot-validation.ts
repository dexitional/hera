// Pure ballot validation, used by castBallotServerFn inside its transaction.
// Kept in its own module (not alongside the createServerFn exports) for the
// client-bundle stripping reason documented in paystack-credit.ts, and so it
// can be unit-tested without a database.

export type BallotSelection = { positionId: string; candidateId: string | null };

export class InvalidBallotError extends Error {
  constructor(message = 'Your ballot is invalid. Please reload the page and vote again.') {
    super(message);
    this.name = 'InvalidBallotError';
  }
}

/**
 * Checks submitted selections against the election's real ballot and returns
 * a clean copy. Throws InvalidBallotError when:
 *   - the ballot is empty or not an array
 *   - a position is not part of this election
 *   - a candidate is unknown, inactive, or belongs to a different position
 *   - the same candidate is picked twice for a position
 *   - a position gets more picks than its `slots`
 *   - an abstention (candidateId null) is combined with any other entry for that position
 *
 * @param ballotPositions  this election's positions
 * @param activeCandidates this election's ACTIVE candidates only
 */
export function validateBallotSelections(
  selections: unknown,
  ballotPositions: { id: string; slots: number | null }[],
  activeCandidates: { id: string; positionId: string }[],
): BallotSelection[] {
  if (!Array.isArray(selections) || selections.length === 0) {
    throw new InvalidBallotError('Your ballot is empty. Please reload the page and vote again.');
  }

  const slotsByPosition = new Map(ballotPositions.map((p) => [p.id, Math.max(1, Number(p.slots) || 1)]));
  const positionOfCandidate = new Map(activeCandidates.map((c) => [c.id, c.positionId]));
  const tallyByPosition = new Map<string, { picked: Set<string>; abstained: boolean }>();
  const valid: BallotSelection[] = [];

  for (const sel of selections as any[]) {
    const positionId = sel?.positionId;
    const candidateId = sel?.candidateId ?? null;

    if (typeof positionId !== 'string' || !slotsByPosition.has(positionId)) throw new InvalidBallotError();
    if (candidateId !== null && (typeof candidateId !== 'string' || positionOfCandidate.get(candidateId) !== positionId)) {
      throw new InvalidBallotError();
    }

    const entry = tallyByPosition.get(positionId) ?? { picked: new Set<string>(), abstained: false };
    if (candidateId === null) {
      if (entry.abstained || entry.picked.size > 0) throw new InvalidBallotError();
      entry.abstained = true;
    } else {
      if (entry.abstained || entry.picked.has(candidateId)) throw new InvalidBallotError();
      entry.picked.add(candidateId);
      if (entry.picked.size > slotsByPosition.get(positionId)!) throw new InvalidBallotError();
    }
    tallyByPosition.set(positionId, entry);
    valid.push({ positionId, candidateId });
  }

  return valid;
}
