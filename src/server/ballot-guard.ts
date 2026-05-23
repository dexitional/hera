import { db } from '../db';
import { elections } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function verifyElectionWindowIsOpen(electionId: number): Promise<boolean> {
  const [election] = await db.select()
    .from(elections)
    .where(eq(elections.id, electionId))
    .limit(1);

  if (!election) return false;

  const rightNow = new Date();
  
  // 1. Structural evaluation block: Is the current time inside the valid election bounds?
  if (rightNow < election.startAt || rightNow > election.endAt) {
    return false;
  }

  // 2. Fallback parameter check: Has it been flagged manually as inactive?
  return election.isActive;
}
