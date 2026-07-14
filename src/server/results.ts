import { createServerFn } from '@tanstack/react-start';
import { db } from '../db';
import { elections, positions, candidates, electionVotes } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { redis, getCacheKeys } from './redis';

export const getFullElectionResults = createServerFn({ method: 'GET'}).handler(
  async (electionId: any) => {
  // Fetch metadata details for the target election
  const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
  if (!election) throw new Error('Election not found.');

  // Aggregate votes for all positions and candidates
  const rows = await db.select({
    positionId: positions.id,
    positionTitle: positions.title,
    candidateId: candidates.id,
    candidateName: candidates.name,
    candidatePhoto: candidates.imageUrl,
    votesReceived: sql<number>`count(${electionVotes.id})::int`
  })
  .from(positions)
  .leftJoin(candidates, eq(candidates.positionId, positions.id))
  .leftJoin(electionVotes, and(
    eq(electionVotes.positionId, positions.id),
    eq(electionVotes.candidateId, candidates.id)
  ))
  .where(eq(positions.electionId, electionId))
  .groupBy(positions.id, candidates.id)
  .orderBy(positions.title, sql`votesReceived DESC`);

  // Restructure the data cleanly by grouping candidates under their respective positions
  const resultsByPosition: Record<string, { title: string; totalPositionVotes: number; candidates: any[] }> = {};

  rows.forEach((row) => {
    if (!resultsByPosition[row.positionId]) {
      resultsByPosition[row.positionId] = {
        title: row.positionTitle,
        totalPositionVotes: 0,
        candidates: []
      };
    }
    resultsByPosition[row.positionId].totalPositionVotes += row.votesReceived || 0;
    resultsByPosition[row.positionId].candidates.push({
      id: row.candidateId,
      name: row.candidateName,
      photo: row.candidatePhoto,
      votes: row.votesReceived || 0
    });
  });

  return {
    electionTitle: election.title,
    positions: Object.values(resultsByPosition)
  };
});



export const getCachedElectionResults = createServerFn({ method: 'GET'}).
  handler(async (electionId: any) => {
    const cacheKey = getCacheKeys.electionResults(electionId);
    try {
    const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (redisError) {
      console.error('Redis connection warning:', redisError);
    }

  const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
  if (!election) throw new Error('Election configuration mismatch.');

  const rows = await db.select({
    positionId: positions.id,
    positionTitle: positions.title,
    candidateId: candidates.id,
    candidateName: candidates.name,
    candidatePhoto: candidates.imageUrl,
    votesReceived: sql<number>`count(${electionVotes.id})::int`
  })
  .from(positions)
  .leftJoin(candidates, eq(candidates.positionId, positions.id))
  .leftJoin(electionVotes, and(
    eq(electionVotes.positionId, positions.id),
    eq(electionVotes.candidateId, candidates.id)
  ))
  .where(eq(positions.electionId, electionId))
  .groupBy(positions.id, candidates.id)
  .orderBy(positions.title, sql`votesReceived DESC`);

  const resultsByPosition: Record<string, { title: string; totalPositionVotes: number; candidates: any[] }> = {};

  rows.forEach((row) => {
    if (!resultsByPosition[row.positionId]) {
      resultsByPosition[row.positionId] = {
        title: row.positionTitle,
        totalPositionVotes: 0,
        candidates: []
      };
    }
    resultsByPosition[row.positionId].totalPositionVotes += row.votesReceived || 0;
    resultsByPosition[row.positionId].candidates.push({
      id: row.candidateId,
      name: row.candidateName,
      photo: row.candidatePhoto,
      votes: row.votesReceived || 0
    });
  });

  const finalReportPayload = {
    electionTitle: election.title,
    positions: Object.values(resultsByPosition)
  };

  try {
    // EX 10 means the cache string expires and deletes itself automatically every 10 seconds.
    // This allows thousands of simultaneous web clients to hit memory while ensuring the live counts are never delayed by more than 10 seconds.
    await redis.set(cacheKey, JSON.stringify(finalReportPayload), 'EX', 10);
  } catch (writeError) {
    console.error('Failed to write back to Redis memory pool:', writeError);
  }

  return finalReportPayload;
});


export const getLiveLeaderboardAggregations = createServerFn({ method: 'GET'}).
handler(async (electionId: any)  => {
    // Offload full-table scan selections and grouping filters to the replica instance
    return await db.select({
      candidateId: electionVotes.candidateId,
      tally: sql<number>`count(${electionVotes.id})::int`
    })
    .from(electionVotes)
    .where(eq(electionVotes.electionId, electionId))
    .groupBy(electionVotes.candidateId);
})
