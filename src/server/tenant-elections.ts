import { authMiddleware } from '#/middleware/authMiddleware';
import { addCountryCode, chunkArray, fetchWithRetry, maskPhoneNumber, prepareVotersForBulkImport, stripCountryCode, wait } from '#/lib/utils';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, inArray, or, sql, ilike, count } from 'drizzle-orm';
import { db } from '../db';
import { candidates, elections, electionVotes, positions, voters, user } from '../db/schema';
import { processImageUpload } from './image-upload';
// import * as XLSX from 'xlsx';
import XLSX from 'xlsx-js-style';
import { arcjetMiddleware } from '#/middleware/arcjetMiddleware';
import { getRequest } from '@tanstack/react-start/server';
import { generateBallotReceiptSignature } from './ballot-signature';


// ELECTIONS FUNCTIONS

export const getElectionsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware,authMiddleware])
  .handler(async ({ context }) => {
    const admin: any = context?.user;
    const resp = await db.select()
      .from(elections)
      .where(eq<any>(elections.adminId, admin.id))
      .orderBy(desc(elections.createdAt));

    return resp;
  });

export const getElectionFn = createServerFn({ method: 'GET' }).middleware([arcjetMiddleware]).handler(
  async ({ data: electionId }: any) => {
    return await db.select().from(elections).where(eq<any>(elections.id, electionId));
  }
);

export const getElectionDataFn = createServerFn({ method: 'GET' }).middleware([arcjetMiddleware]).handler(
  async ({ data: electionId }: any) => {

    try {
      // Queries database matching positions to your raw election id parameter
      const ballotData: any = await db.query.positions.findMany({
        where: eq<any>(positions.electionId, electionId),
        orderBy: [asc(positions.order)],
        with: {
          candidates: {
            where: (candidates: any, { eq }: any) => eq(candidates.isActive, true),
            orderBy: (candidates: any, { asc }: any) => [asc(candidates.order)],
          },
        },
      });

      return ballotData?.map((pos: any) => ({
        id: pos.id,
        electionId: pos.electionId,
        title: pos.title,
        slots: pos.slots,
        candidates: pos?.candidates?.map((cand: any) => ({
          id: cand.id,
          positionId: cand.positionId,
          name: cand.name,
          teaser: cand.teaser,
          imageUrl: cand.imageUrl,
          order: cand.order,
        })),
      }));

    } catch (error: any) {
      console.error('Failed to resolve election ballot structural tree:', error);
      throw new Error('Failed to pull ballot hierarchy.');
    }


  }
);


export const getActiveElectionsFn = createServerFn({ method: 'GET' }).middleware([arcjetMiddleware]).handler(
  async () => {
    return await db.select()
      .from(elections)
      .where(
        and(
          eq<any>(elections.isActive, true),
          eq<any>(elections.makePublic, true)
        )
      );
});


export const createElectionFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware,authMiddleware])
  .handler(async ({ context, data }: any) => {
    try {

      const finalAvatarUrl = await processImageUpload(data.get("image") as File | null, {
        folder: 'logos',
        maxWidth: 512,
        maxHeight: 512,
        quality: 75,
      });

      const resp = await db.insert(elections).values({
        title: data.get("title") as string,
        adminId: context?.user?.id,
        tag: data.get("tag") as string,
        billVoters: data.get("billVoters") as number,
        authMode: data.get("authMode") as string,
        makePublic: data.get("makePublic") as boolean || false,
        showFeed: data.get("showFeed") as boolean || false,
        isActive: data.get("isActive") as boolean || true,
        description: data.get("description") as string,
        status: data.get("status") as string || 'staged',
        startAt: new Date(data.get("startAt") as string),
        endAt: new Date(data.get("endAt") as string),
        ...(finalAvatarUrl && { imageUrl: finalAvatarUrl })
      }).returning();

      console.log(resp);

      return resp;

    } catch (error) {
      console.log(error)
    }
  });

export const updateElectionFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const [ownedElection] = await db
      .select({ id: elections.id })
      .from(elections)
      .where(and(eq<any>(elections.id, data.get("id")), eq<any>(elections.adminId, admin.id)));
    if (!ownedElection) {
      throw new Error('Election not found.');
    }

    try {

      const finalAvatarUrl = await processImageUpload(data.get("image") as File | null, {
        folder: 'logos',
        maxWidth: 512,
        maxHeight: 512,
        quality: 75,
      });
      console.log("finalAvatarUrl", finalAvatarUrl);
      console.log("data form: ", data)
      const resp = await db
        .update(elections)
        .set({
          title: data.get("title") as string,
          tag: data.get("tag") as string,
          billVoters: data.get("billVoters") as number,
          authMode: data.get("authMode") as string,
          makePublic: data.get("makePublic") as boolean,
          showFeed: data.get("showFeed") as boolean,
          isActive: data.get("isActive") as boolean,
          description: data.get("description") as string,
          status: data.get("status") as string,
          startAt: new Date(data.get("startAt") as string),
          endAt: new Date(data.get("endAt") as string),
          ...(finalAvatarUrl && { imageUrl: finalAvatarUrl })
        }).where(eq<any>(elections.id, data.get("id") as string)).returning();

      console.log("resp", resp);

      return resp

    } catch (error) {
      console.log(error)
    }
  });


export const updateElectionStatusFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const { electionId, status } = data;
    const [updated] = await db
      .update(elections)
      .set({ status })
      .where(and(eq<any>(elections.id, electionId), eq<any>(elections.adminId, admin.id)))
      .returning();
    if (!updated) {
      throw new Error('Election not found.');
    }
    return updated;
  });

export const updateElectionPublicStateFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const { electionId, makePublic } = data;
    const [updated] = await db
      .update(elections)
      .set({ makePublic })
      .where(and(eq<any>(elections.id, electionId), eq<any>(elections.adminId, admin.id)))
      .returning();
    if (!updated) {
      throw new Error('Election not found.');
    }
    return updated;
  });

export const resetElectionFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const electionId = data?.electionId ?? data;
    const admin: any = context?.user;

    const [electionRecord] = await db
      .select({ id: elections.id })
      .from(elections)
      .where(
        admin.role === 'super'
          ? eq<any>(elections.id, electionId)
          : and(eq<any>(elections.id, electionId), eq<any>(elections.adminId, admin.id))
      );

    if (!electionRecord) {
      throw new Error(`Election instance [${electionId}] not found.`);
    }

    return await db.transaction(async (tx: any) => {
      await tx.delete(electionVotes).where(eq(electionVotes.electionId, electionId));

      const resetVoters = await tx
        .update(voters)
        .set({ hasVoted: false, voteIp: null })
        .where(eq(voters.electionId, electionId))
        .returning();

      return { success: true, votersReset: resetVoters.length };
    });
  });

export const extendElectionEndTimeFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const { electionId, hours } = data;
    const admin: any = context?.user;

    const [electionRecord] = await db
      .select({ id: elections.id, endAt: elections.endAt })
      .from(elections)
      .where(
        admin.role === 'super'
          ? eq<any>(elections.id, electionId)
          : and(eq<any>(elections.id, electionId), eq<any>(elections.adminId, admin.id))
      );

    if (!electionRecord) {
      throw new Error(`Election instance [${electionId}] not found.`);
    }

    const currentEndAt = electionRecord.endAt ? new Date(electionRecord.endAt) : new Date();
    const nextEndAt = new Date(currentEndAt.getTime() + Number(hours) * 60 * 60 * 1000);

    const [updated] = await db
      .update(elections)
      .set({ endAt: nextEndAt })
      .where(eq<any>(elections.id, electionId))
      .returning();

    return updated;
  });

export const deleteElectionFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: electionId }: any) => {
    const admin: any = context?.user;
    return await db
      .delete(elections)
      .where(and(eq<any>(elections.id, electionId), eq<any>(elections.adminId, admin.id)))
      .returning();
  });



export const getElectionOverview = createServerFn({
  method: "GET",
})
  .middleware([arcjetMiddleware,authMiddleware])
  .handler(async ({ context, data: electionId }): Promise<any> => {
    // 1. Fetch primary election properties from the 'elections' table core node
    const admin: any = context?.user;
    // Super admins can open any tenant's election console; regular admins only their own.
    const ownershipFilter = admin.role === 'super'
      ? eq<any>(elections.id, electionId)
      : and(eq<any>(elections.adminId, admin.id), eq<any>(elections.id, electionId));
    const [electionRecord]: any = await db
      .select()
      .from(elections)
      .where(ownershipFilter);

    if (!electionRecord) {
      throw new Error(`Election resource instance with ID [${electionId}] was not discovered.`);
    }

    // 2. Execute optimal high-concurrency sub-table count aggregations concurrently
    const [
      [positionsCountResult],
      [candidatesCountResult],
      [votersCountResult],
      [votesCountResult],
    ]: any = await Promise.all([
      // Count positions linked to this election instance
      db
        .select({ count: sql<number>`count(${positions.id})::int` })
        .from(positions)
        .where(eq<any>(positions.electionId, electionId)),

      // Count candidates linked to this election by joining through positions
      db
        .select({ count: sql<number>`count(${candidates.id})::int` })
        .from(candidates)
        .innerJoin(positions, eq<any>(candidates.positionId, positions.id))
        .where(eq<any>(positions.electionId, electionId)),

      // Count eligible registered voters enrolled for this election index
      db
        .select({ count: sql<number>`count(${voters.id})::int` })
        .from(voters)
        .where(eq<any>(voters.electionId, electionId)),

      // Count total digital cryptographic ballots cast
      // db
      //   .select({ count: sql<number>`count(${electionVotes.id})::int` })
      //   .from(electionVotes)
      //   .where(eq<any>(electionVotes.electionId, electionId)),

      db
        .select({ count: sql<number>`count(${voters.id})::int` })
        .from(voters)
        .where(and(
          eq<any>(voters.electionId, electionId),
          eq<any>(voters.hasVoted, true)
        )),
    ]);

    return {
      id: electionRecord.id,
      tag: electionRecord.tag,
      title: electionRecord.title,
      status: electionRecord.status,
      description: electionRecord.description,
      // Standardizing JavaScript native Date timestamps cleanly to localized string strings
      startAt: electionRecord?.startAt.toISOString(),
      endAt: electionRecord?.endAt.toISOString(),
      authMode: electionRecord.authMode ?? "OTP",
      isActive: electionRecord.isActive,
      makePublic: electionRecord.makePublic,
      billVoters: electionRecord.billVoters,
      billAmount: electionRecord.billAmount,
      billPaid: electionRecord.billPaid,
      counts: {
        positions: positionsCountResult?.count ?? 0,
        candidates: candidatesCountResult?.count ?? 0,
        voters: votersCountResult?.count ?? 0,
        votesCast: votesCountResult?.count ?? 0,
      },
    };
  });


  export const syncElectionData = createServerFn({
    method: "GET",
  })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: electionId }: any): Promise<any> => {
    const admin: any = context?.user;

    const [
      [electionRecord],
      [votersCountResult],
      rawPositions,
    ] = await Promise.all([
      db.select().from(elections).where(and(eq<any>(elections.id, electionId), eq<any>(elections.adminId, admin.id))),
      db.select({ count: sql<number>`count(${voters.id})::int` }).from(voters).where(eq<any>(voters.electionId, electionId)),
      db.select().from(positions).where(eq<any>(positions.electionId, electionId)),
    ]);

    if (!electionRecord) {
      throw new Error(`Election instance [${electionId}] not found.`);
    }

    const insertData: any = [];
    const deleteData: any = [];
    
    rawPositions.map(async (pos) => {
     
        const [positionTally] = await db
          .select({ count: sql<number>`count(${electionVotes.id})::int` })
          .from(electionVotes)
          .where(eq(electionVotes.positionId, pos.id));

        if(positionTally?.count < votersCountResult?.count){
          // Turnout Greater than Candidates vote Total - Increase Candidates Vote Total
          const diff = votersCountResult?.count - positionTally?.count;
          for(let i = 0; i < diff; i++){
            insertData.push({
              electionId: electionId,
              positionId: pos.id,
              candidateId: null, 
              receiptSignature: `sig_sha256_${crypto.randomUUID().replace(/-/g, "")}`
            })
          }

        } else if (positionTally?.count > votersCountResult?.count){
          // Turnout Less than Candidates vote Total - Reduce Candidates Vote Total
          const diff = positionTally?.count - votersCountResult?.count;
          for(let i = 0; i < diff; i++){
            deleteData.push({
              positionId: pos.id,
              electionId: electionId,
            })
          }
        }
    })

    const result = await db.transaction(async (tx:any) => {
       // Run Bulk Inserts
       await tx.insert(electionVotes).values(insertData);
       // Run Batch/ Bulk Deletes
       await tx.batch(
          deleteData?.map((r: any) =>  tx
          .delete(electionVotes)
          .where(
            and(
              eq(electionVotes.positionId, r.positionId),
              eq(electionVotes.electionId, r.electionId),
            )
          )
          .orderBy(asc(electionVotes.createdAt))
          .limit(1)
        
       ));
       return { success: true };
    });
    
    return result;

  });
  

export const getUnifiedElectionTelemetry = createServerFn({
  method: "GET",
})
 .middleware([arcjetMiddleware,authMiddleware])
 .handler(async ({ data: electionId }): Promise<any> => {

  // Concurrently fetch telemetry data from your database layers
  const [
    [electionRecord],
    [votersCountResult],
    rawPositions,
    rawCandidateTallies,
    rawRecentVotes
  ] = await Promise.all([
    db.select().from(elections).where(eq<any>(elections.id, electionId)),
    db.select({ count: sql<number>`count(${voters.id})::int` }).from(voters).where(eq<any>(voters.electionId, electionId)),
    db.select().from(positions).where(eq<any>(positions.electionId, electionId)),
    db
      .select({
        id: candidates.id,
        name: candidates.name,
        teaser: candidates.teaser,
        imageUrl: candidates.imageUrl,
        positionId: candidates.positionId,
        order: candidates.order,
        voteCount: sql<number>`count(${electionVotes.id})::int`,
      })
      .from(candidates)
      .innerJoin(positions, eq(candidates.positionId, positions.id))
      .leftJoin(
        electionVotes,
        and(
          eq(electionVotes.candidateId, candidates.id),
          eq(electionVotes.positionId, candidates.positionId)
        )
      )
      .where(eq<any>(positions.electionId, electionId))
      .groupBy(candidates.id, candidates.name, candidates.teaser, candidates.imageUrl, candidates.positionId, candidates.order)
      .orderBy(asc(candidates.order), desc(sql`count(${electionVotes.id})`)),
    db
      .select({
        id: electionVotes.id,
        positionTitle: positions.title,
        candidateName: candidates.name,
        createdAt: electionVotes.createdAt,
      })
      .from(electionVotes)
      .innerJoin(positions, eq(electionVotes.positionId, positions.id))
      .leftJoin(candidates, eq(electionVotes.candidateId, candidates.id))
      .where(eq<any>(electionVotes.electionId, electionId))
      .orderBy(desc(electionVotes.createdAt))
      .limit(15)
  ]);

  if (!electionRecord) {
    throw new Error(`Election instance [${electionId}] not found.`);
  }

  const generateVoterMask = (index: number): string => {
    return `voter_id_****_${1000 + (Math.abs(index) % 9000)}`;
  };

  const formatElapsedTime = (pastDate: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - pastDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  const formattedTallies: any[] = await Promise.all(
    rawPositions.map(async (pos) => {
      const positionCandidates = rawCandidateTallies
        .filter((cand) => cand.positionId === pos.id)
        .map((cand, idx) => ({
          id: cand.id,
          name: cand.name,
          teaser: cand.teaser ?? "",
          imageUrl: cand.imageUrl ?? "",
          ballotNumber: cand.order ?? idx + 1,
          votes: cand.voteCount,
        }));

      const [abstentionTally] = await db
        .select({ count: sql<number>`count(${electionVotes.id})::int` })
        .from(electionVotes)
        .where(and(eq(electionVotes.positionId, pos.id), sql`${electionVotes.candidateId} IS NULL`));

      positionCandidates.push({
        id: null,
        name: "Abstained (Blank Ballots)",
        teaser: "",
        imageUrl: "",
        ballotNumber: null,
        votes: abstentionTally?.count || 0
      } as any);

      return {
        id: pos.id,
        title: pos.title,
        slots: pos.slots,
        totalVotesForPosition: positionCandidates.reduce((sum, c) => sum + c.votes, 0),
        candidates: positionCandidates,
      };
    })
  );

  return {
    electionDetails: {
      title: electionRecord.title,
      tag: electionRecord.tag,
      totalEligibleVoters: votersCountResult?.count ?? 0
    },
    tallies: formattedTallies,
    auditLedger: rawRecentVotes.map((log, index) => ({
      id: `tx_${log.id}`,
      positionTitle: log.candidateName ? `${log.positionTitle} (${log.candidateName})` : `${log.positionTitle} (Explicit Abstention)`,
      voterMask: generateVoterMask(index),
      channel: "WEB",
      timestamp: formatElapsedTime(log.createdAt),
    })),
  };
});

export const getUnifiedElectionAdminStats = createServerFn({
  method: "GET",
})
 .middleware([arcjetMiddleware, authMiddleware])
 .handler(async ({ context, data: electionId }: any): Promise<any> => {
  const admin: any = context?.user;

  // Concurrently fetch telemetry data from your database layers
  const [
    [electionRecord],
    [votersCountResult],
    rawPositions,
    rawCandidateTallies,
    rawRecentVotes
  ] = await Promise.all([
    db.select().from(elections).where(and(eq<any>(elections.id, electionId), eq<any>(elections.adminId, admin.id))),
    db.select({ count: sql<number>`count(${voters.id})::int` }).from(voters).where(eq<any>(voters.electionId, electionId)),
    db.select().from(positions).where(eq<any>(positions.electionId, electionId)),
    db
      .select({
        id: candidates.id,
        name: candidates.name,
        teaser: candidates.teaser,
        imageUrl: candidates.imageUrl,
        positionId: candidates.positionId,
        order: candidates.order,
        voteCount: sql<number>`count(${electionVotes.id})::int`,
      })
      .from(candidates)
      .innerJoin(positions, eq(candidates.positionId, positions.id))
      .leftJoin(
        electionVotes,
        and(
          eq(electionVotes.candidateId, candidates.id),
          eq(electionVotes.positionId, candidates.positionId)
        )
      )
      .where(eq<any>(positions.electionId, electionId))
      .groupBy(candidates.id, candidates.name, candidates.teaser, candidates.imageUrl, candidates.positionId, candidates.order)
      .orderBy(asc(candidates.order), desc(sql`count(${electionVotes.id})`)),
    db
      .select({
        id: electionVotes.id,
        positionTitle: positions.title,
        candidateName: candidates.name,
        createdAt: electionVotes.createdAt,
      })
      .from(electionVotes)
      .innerJoin(positions, eq(electionVotes.positionId, positions.id))
      .leftJoin(candidates, eq(electionVotes.candidateId, candidates.id))
      .where(eq<any>(electionVotes.electionId, electionId))
      .orderBy(desc(electionVotes.createdAt))
      .limit(15)
  ]);

  if (!electionRecord) {
    throw new Error(`Election instance [${electionId}] not found.`);
  }

  const generateVoterMask = (index: number): string => {
    return `voter_id_****_${1000 + (Math.abs(index) % 9000)}`;
  };

  const formatElapsedTime = (pastDate: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - pastDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  const formattedTallies: any[] = await Promise.all(
    rawPositions.map(async (pos) => {
      const positionCandidates = rawCandidateTallies
        .filter((cand) => cand.positionId === pos.id)
        .map((cand, idx) => ({
          id: cand.id,
          name: cand.name,
          teaser: cand.teaser ?? "",
          imageUrl: cand.imageUrl ?? "",
          ballotNumber: cand.order ?? idx + 1,
          votes: cand.voteCount,
        }));

      const [abstentionTally] = await db
        .select({ count: sql<number>`count(${electionVotes.id})::int` })
        .from(electionVotes)
        .where(and(eq(electionVotes.positionId, pos.id), sql`${electionVotes.candidateId} IS NULL`));

      positionCandidates.push({
        id: null,
        name: "Abstained (Blank Ballots)",
        teaser: "",
        imageUrl: "",
        ballotNumber: null,
        votes: abstentionTally?.count || 0
      } as any);

      return {
        id: pos.id,
        title: pos.title,
        slots: pos.slots,
        totalVotesForPosition: positionCandidates.reduce((sum, c) => sum + c.votes, 0),
        candidates: positionCandidates,
      };
    })
  );

  return {
    electionDetails: {
      title: electionRecord.title,
      tag: electionRecord.tag,
      totalEligibleVoters: votersCountResult?.count ?? 0
    },
    tallies: formattedTallies,
    auditLedger: rawRecentVotes.map((log, index) => ({
      id: `tx_${log.id}`,
      positionTitle: log.candidateName ? `${log.positionTitle} (${log.candidateName})` : `${log.positionTitle} (Explicit Abstention)`,
      voterMask: generateVoterMask(index),
      channel: "WEB",
      timestamp: formatElapsedTime(log.createdAt),
    })),
  };
});


/* EXPORT ELECTION RESULTS */

export const exportElectionResultsToExcelFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware])
  .handler(async ({ data }: any) => {
    const { electionId } = data;

    try {
      // 1. Fetch telemetry data concurrently using your identical query matrix structure
      const [
        [electionRecord],
        [votersCountResult],
        rawPositions,
        rawCandidateTallies,
        rawRecentVotes
      ] = await Promise.all([
        db.select().from(elections).where(eq(elections.id, electionId)),
        db.select({ count: sql<number>`count(${voters.id})::int` }).from(voters).where(eq(voters.electionId, electionId)),
        db.select().from(positions).where(eq(positions.electionId, electionId)),
        db
          .select({
            id: candidates.id,
            name: candidates.name,
            positionId: candidates.positionId,
            order: candidates.order,
            voteCount: sql<number>`count(${electionVotes.id})::int`,
          })
          .from(candidates)
          .innerJoin(positions, eq(candidates.positionId, positions.id))
          .leftJoin(
            electionVotes,
            and(
              eq(electionVotes.candidateId, candidates.id),
              eq(electionVotes.positionId, candidates.positionId)
            )
          )
          .where(eq(positions.electionId, electionId))
          .groupBy(candidates.id, candidates.name, candidates.positionId, candidates.order)
          .orderBy(asc(candidates.order), desc(sql`count(${electionVotes.id})`)),
        db
          .select({
            id: electionVotes.id,
            positionTitle: positions.title,
            candidateName: candidates.name,
            createdAt: electionVotes.createdAt,
          })
          .from(electionVotes)
          .innerJoin(positions, eq(electionVotes.positionId, positions.id))
          .leftJoin(candidates, eq(electionVotes.candidateId, candidates.id))
          .where(eq(electionVotes.electionId, electionId))
          .orderBy(desc(electionVotes.createdAt))
          .limit(100) // Expanded limit context for richer reporting audits
      ]);

      if (!electionRecord) {
        throw new Error(`Election instances index [${electionId}] not found.`);
      }

      // Initialize workbook target instance
      const workbook = XLSX.utils.book_new();

      // ================= SHEET 1: EXECUTIVE SUMMARY =================
      const summaryRows = [
        { 'Election Metric Description': 'Election Title', 'Value / Metric Tally': electionRecord.title },
        { 'Election Metric Description': 'Election Identifier Tag', 'Value / Metric Tally': electionRecord.tag },
        { 'Election Metric Description': 'Total Registered Eligible Voters', 'Value / Metric Tally': votersCountResult?.count ?? 0 },
        { 'Election Metric Description': 'Configured Positions Scope Count', 'Value / Metric Tally': rawPositions.length },
        { 'Election Metric Description': 'Registered Candidates Count', 'Value / Metric Tally': rawCandidateTallies.length },
        { 'Election Metric Description': 'Export Generation Timestamp', 'Value / Metric Tally': new Date().toLocaleString() }
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      summarySheet['!cols'] = [{ wch: 35 }, { wch: 45 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');


      // ================= SHEET 2: FINAL RESULTS TALLIES =================
      const talliesRows: any[] = [];

      // Iterate over your structure synchronously to match abstentions accurately
      for (const pos of rawPositions) {
        // Find position candidates
        const positionCandidates = rawCandidateTallies.filter((cand) => cand.positionId === pos.id);

        // Fetch blank ballot tallies for the current positional layout chunk
        const [abstentionTally] = await db
          .select({ count: sql<number>`count(${electionVotes.id})::int` })
          .from(electionVotes)
          .where(and(eq(electionVotes.positionId, pos.id), sql`${electionVotes.candidateId} IS NULL`));

        const abstentionCount = abstentionTally?.count || 0;
        const totalVotesForPos = positionCandidates.reduce((sum, c) => sum + c.voteCount, 0) + abstentionCount;

        // Header Row for each Position Block
        talliesRows.push({
          'Target Position': pos.title.toUpperCase(),
          'Candidate Name': `Available Slots: ${pos.slots}`,
          'Votes Counted': `Total Position Ballots: ${totalVotesForPos}`,
          'Percentage Share': ''
        });

        // Map individual candidates inside this block
        positionCandidates.forEach((cand) => {
          const sharePct = totalVotesForPos > 0 ? ((cand.voteCount / totalVotesForPos) * 100).toFixed(2) + '%' : '0.00%';
          talliesRows.push({
            'Target Position': '',
            'Candidate Name': cand.name,
            'Votes Counted': cand.voteCount,
            'Percentage Share': sharePct
          });
        });

        // Add the Abstention context metrics tracking metric rows
        const abstentionSharePct = totalVotesForPos > 0 ? ((abstentionCount / totalVotesForPos) * 100).toFixed(2) + '%' : '0.00%';
        talliesRows.push({
          'Target Position': '',
          'Candidate Name': 'Abstained (Blank Ballots)',
          'Votes Counted': abstentionCount,
          'Percentage Share': abstentionSharePct
        });

        // Blank separator spacer row to ease readability between positions
        talliesRows.push({ 'Target Position': '', 'Candidate Name': '', 'Votes Counted': '', 'Percentage Share': '' });
      }

      const talliesSheet = XLSX.utils.json_to_sheet(talliesRows);
      talliesSheet['!cols'] = [{ wch: 25 }, { wch: 32 }, { wch: 22 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(workbook, talliesSheet, 'Final Results Tallies');


      // ================= SHEET 3: RECENT AUDIT LEDGER =================
      const generateVoterMask = (index: number): string => `voter_id_****_${1000 + (Math.abs(index) % 9000)}`;

      const auditRows = rawRecentVotes.map((log, index) => ({
        'Transaction Hash ID': `tx_${log.id}`,
        'Action Description Reference': log.candidateName ? `${log.positionTitle} (${log.candidateName})` : `${log.positionTitle} (Explicit Abstention)`,
        'Anonymous Voter Identifier': generateVoterMask(index),
        'Channel System Route': 'WEB',
        'Casting Date Log': new Date(log.createdAt).toLocaleString()
      }));

      const auditSheet = XLSX.utils.json_to_sheet(auditRows);
      auditSheet['!cols'] = [{ wch: 16 }, { wch: 42 }, { wch: 26 }, { wch: 20 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(workbook, auditSheet, 'Recent Audit Ledger');


      // 2. Generate multi-sheet binary base64 payloads data stream package
      const excelBuffer64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const cleanTag = electionRecord.tag.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      return {
        success: true,
        filename: `election_${cleanTag}_certified_results.xlsx`,
        base64Data: excelBuffer64
      };

    } catch (error: any) {
      console.error('Export Election Results Server Function Error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to securely generate election analytics report workbook.',
        filename: '',
        base64Data: ''
      };
    }
  });


export const exportElectionResultsToFormatExcelFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware])
  .handler(async ({ data }: any) => {
    const { electionId } = data;
    try {
      // Fetch telemetry data layers concurrently
      const [
        [electionRecord],
        [votersCountResult],
        rawPositions,
        rawCandidateTallies,
        rawRecentVotes
      ] = await Promise.all([
        db.select().from(elections).where(eq(elections.id, electionId)),
        db.select({ count: sql<number>`count(${voters.id})::int` }).from(voters).where(eq(voters.electionId, electionId)),
        db.select().from(positions).where(eq(positions.electionId, electionId)),
        db
          .select({
            id: candidates.id,
            name: candidates.name,
            positionId: candidates.positionId,
            order: candidates.order,
            voteCount: sql<number>`count(${electionVotes.id})::int`,
          })
          .from(candidates)
          .innerJoin(positions, eq(candidates.positionId, positions.id))
          .leftJoin(
            electionVotes,
            and(
              eq(electionVotes.candidateId, candidates.id),
              eq(electionVotes.positionId, candidates.positionId)
            )
          )
          .where(eq(positions.electionId, electionId))
          .groupBy(candidates.id, candidates.name, candidates.positionId, candidates.order)
          .orderBy(asc(candidates.order), desc(sql`count(${electionVotes.id})`)),
        db
          .select({
            id: electionVotes.id,
            positionTitle: positions.title,
            candidateName: candidates.name,
            createdAt: electionVotes.createdAt,
          })
          .from(electionVotes)
          .innerJoin(positions, eq(electionVotes.positionId, positions.id))
          .leftJoin(candidates, eq(electionVotes.candidateId, candidates.id))
          .where(eq(electionVotes.electionId, electionId))
          .orderBy(desc(electionVotes.createdAt))
        // .limit(100)
      ]);

      if (!electionRecord) {
        throw new Error(`Election instances index [${electionId}] not found.`);
      }

      const workbook = XLSX.utils.book_new();

      // Common style definitions helper configurations
      const STYLES = {
        mainHeader: {
          font: { name: 'Arial', size: 11, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '0A192A' } }, // Clean indigo background shade
          alignment: { horizontal: 'left', vertical: 'center' }
        },
        positionRow: {
          font: { name: 'Arial', size: 11, bold: true, color: { rgb: '1E1B4B' } },
          fill: { fgColor: { rgb: 'E0E7FF' } }, // Light soft purple/blue section marker fill
          alignment: { horizontal: 'left', vertical: 'center' }
        },
        voterAbstentionRow: {
          font: { name: 'Arial', size: 10, italic: true, color: { rgb: '4B5563' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        },
        defaultText: {
          font: { name: 'Arial', size: 10 },
          alignment: { horizontal: 'left', vertical: 'center' }
        }
      };

      // Helper function to format an array of objects to sheet cells with specific custom styling weights applied
      const createStyledSheet = (headers: string[], rows: any[], columnWidths: { wch: number }[]) => {
        const ws: XLSX.WorkSheet = {};
        ws['!cols'] = columnWidths;

        // 1. Generate Bold Header Row Elements
        headers.forEach((header, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
          ws[cellRef] = { v: header, t: 's', s: STYLES.mainHeader };
        });

        // 2. Loop and map dataset records onto spreadsheet cells
        rows.forEach((row, rowIndex) => {
          const sheetRowIndex = rowIndex + 1;

          // Check if this row represents an explicit structural position divider row block
          const isPositionDivider = row._type === 'POSITION_HEADER';
          const isAbstention = row._type === 'ABSTENTION_ROW';

          let currentStyle = STYLES.defaultText;
          if (isPositionDivider) currentStyle = STYLES.positionRow;
          if (isAbstention) currentStyle = STYLES.voterAbstentionRow;

          headers.forEach((_, colIndex) => {
            const cellKey = Object.keys(row).filter(k => k !== '_type')[colIndex];
            if (!cellKey) return;

            const cellValue = row[cellKey];
            const cellRef = XLSX.utils.encode_cell({ r: sheetRowIndex, c: colIndex });

            ws[cellRef] = {
              v: cellValue,
              t: typeof cellValue === 'number' ? 'n' : 's',
              s: currentStyle
            };
          });
        });

        // Set range limits safely
        const maxRow = rows.length;
        const maxCol = headers.length - 1;
        ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: maxRow, c: maxCol });

        return ws;
      };


      // ================= SHEET 1: EXECUTIVE SUMMARY =================
      const summaryHeaders = ['Election Metric Description', 'Value / Metric Tally'];
      const summaryRows = [
        { desc: 'Election Title', val: electionRecord.title },
        { desc: 'Election Identifier Tag', val: electionRecord.tag },
        { desc: 'Total Registered Eligible Voters', val: votersCountResult?.count ?? 0 },
        { desc: 'Configured Positions Scope Count', val: rawPositions.length },
        { desc: 'Registered Candidates Count', val: rawCandidateTallies.length },
        { desc: 'Export Generation Timestamp', val: new Date().toLocaleString() }
      ];
      const summarySheet = createStyledSheet(summaryHeaders, summaryRows, [{ wch: 35 }, { wch: 45 }]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');


      // ================= SHEET 2: FINAL RESULTS TALLIES =================
      const talliesHeaders = ['Target Position', 'Candidate Name', 'Votes Counted', 'Percentage Share'];
      const talliesRows: any[] = [];

      for (const pos of rawPositions) {
        const positionCandidates = rawCandidateTallies.filter((cand) => cand.positionId === pos.id);
        const [abstentionTally] = await db
          .select({ count: sql<number>`count(${electionVotes.id})::int` })
          .from(electionVotes)
          .where(and(eq(electionVotes.positionId, pos.id), sql`${electionVotes.candidateId} IS NULL`));

        const abstentionCount = abstentionTally?.count || 0;
        const totalVotesForPos = positionCandidates.reduce((sum, c) => sum + c.voteCount, 0) + abstentionCount;

        // Position Section Banner Row (receives positionRow styling automatically)
        talliesRows.push({
          _type: 'POSITION_HEADER',
          posTitle: pos.title.toUpperCase(),
          candName: `Available Slots: ${pos.slots}`,
          vCount: `Total Ballots: ${totalVotesForPos}`,
          pct: ''
        });

        // Map candidates rows
        positionCandidates.forEach((cand) => {
          const sharePct = totalVotesForPos > 0 ? ((cand.voteCount / totalVotesForPos) * 100).toFixed(2) + '%' : '0.00%';
          talliesRows.push({
            _type: 'DEFAULT',
            posTitle: '',
            candName: cand.name,
            vCount: cand.voteCount,
            pct: sharePct
          });
        });

        // Add Blank Ballots Metric Context Row
        const abstentionSharePct = totalVotesForPos > 0 ? ((abstentionCount / totalVotesForPos) * 100).toFixed(2) + '%' : '0.00%';
        talliesRows.push({
          _type: 'ABSTENTION_ROW',
          posTitle: '',
          candName: 'Abstained (Blank Ballots)',
          vCount: abstentionCount,
          pct: abstentionSharePct
        });

        // Empty row space element wrapper
        talliesRows.push({ _type: 'DEFAULT', posTitle: '', candName: '', vCount: '', pct: '' });
      }

      const talliesSheet = createStyledSheet(talliesHeaders, talliesRows, [{ wch: 25 }, { wch: 32 }, { wch: 22 }, { wch: 18 }]);
      XLSX.utils.book_append_sheet(workbook, talliesSheet, 'Final Results Tallies');


      // ================= SHEET 3: RECENT AUDIT LEDGER =================
      const auditHeaders = ['Transaction Hash ID', 'Action Description Reference', 'Anonymous Voter Identifier', 'Channel System Route', 'Casting Date Log'];
      const generateVoterMask = (index: number): string => `voter_id_****_${1000 + (Math.abs(index) % 9000)}`;

      const auditRows = rawRecentVotes.map((log, index) => ({
        _type: 'DEFAULT',
        txId: `tx_${log.id}`,
        desc: log.candidateName ? `${log.positionTitle} (${log.candidateName})` : `${log.positionTitle} (Explicit Abstention)`,
        mask: generateVoterMask(index),
        channel: 'WEB',
        date: new Date(log.createdAt).toLocaleString()
      }));

      const auditSheet = createStyledSheet(auditHeaders, auditRows, [{ wch: 18 }, { wch: 42 }, { wch: 26 }, { wch: 20 }, { wch: 24 }]);
      XLSX.utils.book_append_sheet(workbook, auditSheet, 'Recent Audit Ledger');


      // Convert styled document structures matrix to Base64 delivery package
      const excelBuffer64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const cleanTag = electionRecord.tag.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      return {
        success: true,
        filename: `election_${cleanTag}_formatted_results.xlsx`,
        base64Data: excelBuffer64
      };

    } catch (error: any) {
      console.error('Export Election Results Style Script Error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to safely style generated excel workbook sheets content.',
        filename: '', base64Data: ''
      };
    }
  });


/* FINAL RESULTS PRINT PAGE DATA */

export const getElectionFinalResultsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const electionId = data?.electionId ?? data;
    const admin: any = context?.user;

    const [
      [electionRecord],
      [votersCountResult],
      [votedCountResult],
      rawPositions,
      rawCandidateTallies,
    ] = await Promise.all([
      db
        .select({
          id: elections.id,
          tag: elections.tag,
          title: elections.title,
          description: elections.description,
          imageUrl: elections.imageUrl,
          startAt: elections.startAt,
          endAt: elections.endAt,
          status: elections.status,
          organizerName: user.name,
          organizerImage: user.image,
        })
        .from(elections)
        .innerJoin(user, eq(elections.adminId, user.id))
        .where(
          admin.role === 'super'
            ? eq<any>(elections.id, electionId)
            : and(eq<any>(elections.id, electionId), eq<any>(elections.adminId, admin.id))
        ),
      db.select({ count: sql<number>`count(${voters.id})::int` }).from(voters).where(eq<any>(voters.electionId, electionId)),
      db
        .select({ count: sql<number>`count(${voters.id})::int` })
        .from(voters)
        .where(and(eq<any>(voters.electionId, electionId), eq<any>(voters.hasVoted, true))),
      db.select().from(positions).where(eq<any>(positions.electionId, electionId)).orderBy(asc(positions.order), asc(positions.createdAt)),
      db
        .select({
          id: candidates.id,
          name: candidates.name,
          teaser: candidates.teaser,
          imageUrl: candidates.imageUrl,
          order: candidates.order,
          positionId: candidates.positionId,
          voteCount: sql<number>`count(${electionVotes.id})::int`,
        })
        .from(candidates)
        .innerJoin(positions, eq(candidates.positionId, positions.id))
        .leftJoin(
          electionVotes,
          and(eq(electionVotes.candidateId, candidates.id), eq(electionVotes.positionId, candidates.positionId))
        )
        .where(eq<any>(positions.electionId, electionId))
        .groupBy(candidates.id, candidates.name, candidates.teaser, candidates.imageUrl, candidates.order, candidates.positionId)
        .orderBy(asc(candidates.order)),
    ]);

    if (!electionRecord) {
      throw new Error(`Election instance [${electionId}] not found.`);
    }

    const registeredVoters = votersCountResult?.count ?? 0;
    const votedCount = votedCountResult?.count ?? 0;
    const absentees = Math.max(registeredVoters - votedCount, 0);
    const turnoutPercentage = registeredVoters > 0 ? (votedCount / registeredVoters) * 100 : 0;

    const positionResults = await Promise.all(
      rawPositions.map(async (pos, posIdx) => {
        const positionCandidates = rawCandidateTallies
          .filter((cand) => cand.positionId === pos.id)
          .map((cand, idx) => ({
            id: cand.id,
            name: cand.name,
            teaser: cand.teaser ?? '',
            imageUrl: cand.imageUrl ?? '',
            ballotNumber: cand.order ?? idx + 1,
            votes: cand.voteCount,
          }));

        const [abstentionTally] = await db
          .select({ count: sql<number>`count(${electionVotes.id})::int` })
          .from(electionVotes)
          .where(and(eq(electionVotes.positionId, pos.id), sql`${electionVotes.candidateId} IS NULL`));

        const abstentions = abstentionTally?.count ?? 0;
        const totalVotesForPosition = positionCandidates.reduce((sum, c) => sum + c.votes, 0) + abstentions;

        // Determine the vote-count cutoff for winning the available slots, honoring ties at the boundary
        const sortedByVotes = [...positionCandidates].sort((a, b) => b.votes - a.votes);
        const cutoffVotes = sortedByVotes[pos.slots - 1]?.votes ?? -1;

        const rankedCandidates = positionCandidates
          .map((cand) => ({
            ...cand,
            percentage: totalVotesForPosition > 0 ? (cand.votes / totalVotesForPosition) * 100 : 0,
            isWinner: totalVotesForPosition > 0 && cand.votes > 0 && cand.votes >= cutoffVotes,
          }))
          .sort((a, b) => b.votes - a.votes);

        return {
          id: pos.id,
          title: pos.title,
          slots: pos.slots,
          order: pos.order ?? posIdx,
          totalVotesForPosition,
          abstentions,
          abstentionPercentage: totalVotesForPosition > 0 ? (abstentions / totalVotesForPosition) * 100 : 0,
          candidates: rankedCandidates,
        };
      })
    );

    return {
      election: {
        id: electionRecord.id,
        tag: electionRecord.tag,
        title: electionRecord.title,
        description: electionRecord.description,
        imageUrl: electionRecord.imageUrl || electionRecord.organizerImage || '',
        organizerName: electionRecord.organizerName,
        startAt: electionRecord.startAt ? electionRecord.startAt.toISOString() : null,
        endAt: electionRecord.endAt ? electionRecord.endAt.toISOString() : null,
        status: electionRecord.status,
      },
      stats: {
        registeredVoters,
        votedCount,
        absentees,
        turnoutPercentage,
      },
      positions: positionResults.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    };
  });


// POSITION FUNCTIONS

export const getPositionsListFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware,authMiddleware])
  .handler(async ({ data: electionId, context }) => {
    const admin: any = context?.user

    return await db.select()
      .from(positions)
      .innerJoin(elections, eq<any>(positions.electionId, elections.id))
      .where(
        admin.role === 'super'
          ? eq<any>(elections.id, electionId)
          : and(eq<any>(elections.adminId, admin.id), eq<any>(elections.id, electionId))
      )
      .orderBy(asc(positions.order), asc(positions.createdAt));
  });

export const getPositionsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware,authMiddleware])
  .handler(async ({ data, context }: any) => {
    const electionId = data?.electionId ?? data;
    const admin: any = context?.user;
    const page = Math.max(Number(data?.page) || 1, 1);
    const pageSize = Math.max(Number(data?.pageSize) || 15, 1);
    const searchQuery = (data?.searchQuery || "").trim();

    const limitValue = pageSize;
    const offsetValue = (page - 1) * limitValue;

    const conditions: any = admin.role === 'super'
      ? [eq(elections.id, electionId)]
      : [eq(elections.adminId, admin.id), eq(elections.id, electionId)];
    if (searchQuery) {
      conditions.push(ilike(positions.title, `%${searchQuery}%`));
    }
    const queryCondition = and(...conditions);

    const [rows, [countResult]] = await Promise.all([
      db
        .select({
          position: positions,
          election: elections,
          candidatesCount: sql<number>`count(${candidates.id})::int`,
        })
        .from(positions)
        .innerJoin(elections, eq<any>(positions.electionId, elections.id))
        .leftJoin(candidates, eq<any>(candidates.positionId, positions.id))
        .where(queryCondition)
        .groupBy(positions.id, elections.id)
        .orderBy(asc(positions.order), asc(positions.createdAt))
        .limit(limitValue)
        .offset(offsetValue),
      db
        .select({ total: count() })
        .from(positions)
        .innerJoin(elections, eq<any>(positions.electionId, elections.id))
        .where(queryCondition),
    ]);

    const totalCount = countResult?.total ?? 0;
    const totalPages = Math.max(Math.ceil(totalCount / limitValue), 1);

    return {
      positions: rows,
      pagination: { totalCount, totalPages, currentPage: page, pageSize: limitValue },
    };
});

export const getPositionFn = createServerFn({ method: 'GET' }).middleware([arcjetMiddleware]).handler(
  async ({ data: positionId }: any) => {
    return await db.select().from(positions).where(eq<any>(positions.id, positionId));
  }
);

export const createPositionFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const [ownedElection] = await db
      .select({ id: elections.id })
      .from(elections)
      .where(and(eq<any>(elections.id, data.electionId), eq<any>(elections.adminId, admin.id)));
    if (!ownedElection) {
      throw new Error('Election not found.');
    }
    return await db.insert(positions).values({
      electionId: data.electionId,
      order: data.order,
      title: data.title,
      slots: data.slots,
    }).returning();
  });

export const updatePositionFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const [ownedPosition] = await db
      .select({ id: positions.id })
      .from(positions)
      .innerJoin(elections, eq(positions.electionId, elections.id))
      .where(and(eq<any>(positions.id, data.id), eq<any>(elections.adminId, admin.id)));
    if (!ownedPosition) {
      throw new Error('Position not found.');
    }
    return await db
      .update(positions)
      .set({
        electionId: data.electionId,
        order: data.order,
        title: data.title,
        slots: data.slots,
      })
      .where(eq<any>(positions.id, data.id)).returning();
  });


export const deletePositionFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: positionId }: any) => {
    const admin: any = context?.user;
    const [ownedPosition] = await db
      .select({ id: positions.id })
      .from(positions)
      .innerJoin(elections, eq(positions.electionId, elections.id))
      .where(and(eq<any>(positions.id, positionId), eq<any>(elections.adminId, admin.id)));
    if (!ownedPosition) {
      throw new Error('Position not found.');
    }
    return await db.delete(positions).where(eq<any>(positions.id, positionId)).returning();
  });


// CANDIDATES FUNCTIONS

export const getCandidatesFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware,authMiddleware])
  .handler(async ({ data, context }: any) => {
    const electionId = data?.electionId ?? data;
    const admin: any = context?.user;
    const page = Math.max(Number(data?.page) || 1, 1);
    const pageSize = Math.max(Number(data?.pageSize) || 15, 1);
    const searchQuery = (data?.searchQuery || "").trim();
    const positionFilter = data?.positionFilter || "ALL";

    const limitValue = pageSize;
    const offsetValue = (page - 1) * limitValue;

    const conditions: any = admin.role === 'super'
      ? [eq(elections.id, electionId)]
      : [eq(elections.adminId, admin.id), eq(elections.id, electionId)];
    if (searchQuery) {
      conditions.push(ilike(candidates.name, `%${searchQuery}%`));
    }
    if (positionFilter !== "ALL") {
      conditions.push(eq(positions.title, positionFilter));
    }
    const queryCondition = and(...conditions);

    const [rows, [countResult], positionOptions] = await Promise.all([
      db.select()
        .from(candidates)
        .leftJoin(positions, eq<any>(candidates.positionId, positions.id))
        .leftJoin(elections, eq<any>(positions.electionId, elections.id))
        .where(queryCondition)
        .orderBy(asc(positions.order), asc(positions.createdAt), asc(candidates.order))
        .limit(limitValue)
        .offset(offsetValue),
      db.select({ total: count() })
        .from(candidates)
        .leftJoin(positions, eq<any>(candidates.positionId, positions.id))
        .leftJoin(elections, eq<any>(positions.electionId, elections.id))
        .where(queryCondition),
      db.select({ title: positions.title })
        .from(positions)
        .where(eq<any>(positions.electionId, electionId))
        .orderBy(asc(positions.order)),
    ]);

    const totalCount = countResult?.total ?? 0;
    const totalPages = Math.max(Math.ceil(totalCount / limitValue), 1);

    return {
      candidates: rows,
      positionTitles: positionOptions.map((p: any) => p.title),
      pagination: { totalCount, totalPages, currentPage: page, pageSize: limitValue },
    };
  });


export const getCandidateFn = createServerFn({ method: 'GET' }).middleware([arcjetMiddleware]).handler(
  async ({ data: candidateId }: any) => {
    return await db.select().from(candidates).where(eq<any>(candidates.id, candidateId));
  }
);

export const createCandidateFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const [ownedPosition] = await db
      .select({ id: positions.id })
      .from(positions)
      .innerJoin(elections, eq(positions.electionId, elections.id))
      .where(and(eq<any>(positions.id, data.get("positionId")), eq<any>(elections.adminId, admin.id)));
    if (!ownedPosition) {
      throw new Error('Position not found.');
    }

    try {

      const finalAvatarUrl = await processImageUpload(data.get("image") as File | null, {
        folder: 'candidates',
        maxWidth: 800,
        maxHeight: 800,
        quality: 75,
      });

      // Return Response
      return await db.insert(candidates).values({
        positionId: data.get("positionId") as string,
        order: data.get("order") as number,
        name: data.get("name") as string,
        teaser: data.get("teaser") as string,
        isActive: (data.get("isActive") || 'true') as boolean,
        ...(finalAvatarUrl && { imageUrl: finalAvatarUrl })
      }).returning();

    } catch (error) {
      console.log(error)
    }

  });

export const updateCandidateFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const [ownedCandidate] = await db
      .select({ id: candidates.id })
      .from(candidates)
      .innerJoin(positions, eq(candidates.positionId, positions.id))
      .innerJoin(elections, eq(positions.electionId, elections.id))
      .where(and(eq<any>(candidates.id, data.get("id")), eq<any>(elections.adminId, admin.id)));
    if (!ownedCandidate) {
      throw new Error('Candidate not found.');
    }

    try {

      const finalAvatarUrl = await processImageUpload(data.get("image") as File | null, {
        folder: 'candidates',
        maxWidth: 800,
        maxHeight: 800,
        quality: 75,
      });

      // Return Response
      return await db
        .update(candidates)
        .set({
          positionId: data.get("positionId") as string,
          order: data.get("order") as number,
          name: data.get("name") as string,
          teaser: data.get("teaser") as string,
          isActive: data.get("isActive") as boolean,
          ...(finalAvatarUrl && { imageUrl: finalAvatarUrl })
        })
        .where(eq<any>(candidates.id, data.get("id") as string)).returning();

    } catch (error) {
      console.log(error)
    }
  });


export const deleteCandidateFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: candidateId }: any) => {
    const admin: any = context?.user;
    const [ownedCandidate] = await db
      .select({ id: candidates.id })
      .from(candidates)
      .innerJoin(positions, eq(candidates.positionId, positions.id))
      .innerJoin(elections, eq(positions.electionId, elections.id))
      .where(and(eq<any>(candidates.id, candidateId), eq<any>(elections.adminId, admin.id)));
    if (!ownedCandidate) {
      throw new Error('Candidate not found.');
    }
    return await db.delete(candidates).where(eq<any>(candidates.id, candidateId)).returning();
  });


// VOTERS FUNCTIONS

export const getVotersListFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context }) => {
    // const admin = { id: '1' };
    const admin: any = context.user.id;
    return await db.select()
      .from(voters)
      .innerJoin(elections, eq<any>(positions.electionId, elections.id))
      .where(eq<any>(elections.adminId, admin.id))
      .orderBy(asc(positions.order), asc(positions.createdAt));
  });

export const getVotersFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context }) => {
    const admin: any = context.user.id;

    return await db
      .select()
      .from(voters)
      .innerJoin(elections, eq<any>(voters.electionId, elections.id))
      .where(eq<any>(elections.adminId, admin.id))
      .orderBy(asc(voters.id));
  }
  );

export const getVotersByElectionFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ data }: any) => {
    const electionId = data?.electionId ?? data;
    const page = Math.max(Number(data?.page) || 1, 1);
    const pageSize = Math.max(Number(data?.pageSize) || 15, 1);
    const searchQuery = (data?.searchQuery || "").trim();
    const statusFilter = data?.statusFilter || "ALL";

    const limitValue = pageSize;
    const offsetValue = (page - 1) * limitValue;

    const conditions: any = [eq(voters.electionId, electionId)];

    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      conditions.push(
        or(
          ilike(voters.name, searchPattern),
          ilike(voters.username, searchPattern),
          ilike(voters.email, searchPattern),
          ilike(voters.phoneNumber, searchPattern)
        )
      );
    }

    if (statusFilter === "VOTED") {
      conditions.push(eq(voters.hasVoted, true));
    } else if (statusFilter === "PENDING") {
      conditions.push(eq(voters.hasVoted, false));
    }

    const queryCondition = and(...conditions);

    const [votersRecords, [countResult]] = await Promise.all([
      db
        .select({
          id: voters.id,
          name: voters.name,
          username: voters.username,
          phoneNumber: voters.phoneNumber,
          email: voters.email,
          inviteToken: voters.inviteToken,
          isVerified: voters.isVerified,
          hasVoted: voters.hasVoted,
          invitedAt: voters.invitedAt,
        })
        .from(voters)
        .innerJoin(elections, eq(voters.electionId, elections.id))
        .where(queryCondition)
        .orderBy(asc(voters.id))
        .limit(limitValue)
        .offset(offsetValue),

      db
        .select({ total: count() })
        .from(voters)
        .innerJoin(elections, eq(voters.electionId, elections.id))
        .where(queryCondition),
    ]);

    const totalCount = countResult?.total ?? 0;
    const totalPages = Math.max(Math.ceil(totalCount / limitValue), 1);

    return {
      voters: votersRecords,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize: limitValue,
      },
    };
  }
);




export const getVoterFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: voterId }: any) => {
    const admin: any = context?.user;
    return await db
      .select({ voters })
      .from(voters)
      .innerJoin(elections, eq(voters.electionId, elections.id))
      .where(and(eq<any>(voters.id, voterId), eq<any>(elections.adminId, admin.id)))
      .then((rows) => rows.map((r) => r.voters));
  });

export const getElectionByTagFn = createServerFn({ method: 'GET' }).middleware([arcjetMiddleware]).handler(
  async ({ data: tag }: any) => {
    return await db.select().from(elections).where(eq<any>(elections.tag, tag));
  }
);



export const createVoterFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const [ownedElection] = await db
      .select({ id: elections.id })
      .from(elections)
      .where(and(eq<any>(elections.id, data.electionId), eq<any>(elections.adminId, admin.id)));
    if (!ownedElection) {
      throw new Error('Election not found.');
    }
    return await db.insert(voters).values({
      electionId: data.electionId,
      name: data.name,
      username: data.username,
      phoneNumber: data.phoneNumber,
      email: data.email,
      inviteToken: data.inviteToken,
      isVerified: data.isVerified,
    } as any).returning();
  });

export const updateVoterFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const [ownedVoter] = await db
      .select({ id: voters.id })
      .from(voters)
      .innerJoin(elections, eq(voters.electionId, elections.id))
      .where(and(eq<any>(voters.id, data.id), eq<any>(elections.adminId, admin.id)));
    if (!ownedVoter) {
      throw new Error('Voter not found.');
    }
    return await db
      .update(voters)
      .set({
        electionId: data.electionId,
        name: data.name,
        username: data.username,
        phoneNumber: data.phoneNumber,
        email: data.email,
        inviteToken: data.inviteToken,
        isVerified: data.isVerified,
      })
      .where(eq<any>(voters.id, data.id)).returning();
  });


  export const verifyVoterFn = createServerFn({ method: 'POST' }).middleware([arcjetMiddleware]).handler(
    async ({ data }: any) => {
      try {
        const phoneNumberCode = addCountryCode(data?.phone);
        const phoneNumberNoCode = stripCountryCode(data?.phone);
        const cleanUsername = data.username.toLowerCase().replace(/\s+/g, '');

        let [voter] = ['credential'].includes(data.authMode)
        ? await db
          .select()
          .from(voters)
          .innerJoin(elections, eq<any>(voters.electionId, elections.id))
          .where(
            and(
              // eq<any>(voters.username, data.username), 
              eq(sql`LOWER(REPLACE(${voters.username}, ' ', ''))`, cleanUsername), 
              eq<any>(voters.inviteToken, data.password),
              eq<any>(elections.id, data.electionId)
            )
          )
          .orderBy(asc(voters.id))

        : await db
          .select()
          .from(voters)
          .innerJoin(elections, eq<any>(voters.electionId, elections.id))
          .where(
            and(
              eq<any>(voters.username, data.username),
              eq<any>(elections.id, data.electionId),
              or(
                eq<any>(voters.phoneNumber, phoneNumberCode),
                eq<any>(voters.phoneNumber, phoneNumberNoCode)
              )
            )
          )
          .orderBy(asc(voters.id));

        
        if (voter){
          
          const inviteToken = voter?.voters?.inviteToken || '1234';
          const isVerified = voter?.voters?.isVerified;
          const phone = addCountryCode(voter?.voters?.phoneNumber);
          const fname = voter?.voters?.name?.split(" ")[0];
          // const username = voter?.voters?.username;
              
          // Sent OTP to voter for verification
          if(data.authMode == 'otp' && !isVerified){
              const smsPayload: any = {
                sender: process.env.SMS_SENDER_ID,
                message: `Hi ${fname}, Your verification OTP is ${inviteToken}. This expires in 15 minutes, Thank you`,
                recipients: [phone],
              };
              const sms: any = await fetch(`${process.env.SMS_API_URL}/sms/send`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'api-key': process.env.SMS_API_KEY
                } as any,
                body: JSON.stringify(smsPayload)
              });

              if (!sms.ok) {
                const errorText = await sms.text();
                throw new Error(`SMS API HTTP Error! Status: ${sms.status} - ${errorText}`);
              }

              const resp = await sms.json();
              console.log(resp);
              if (resp) {
                await db
                  .update(voters)
                  .set({
                    isVerified: true,
                    inviteToken
                  })
                  .where(eq<any>(voters.id, voter?.voters?.id)).returning();
                
                return { success: true, data: voter, otp: inviteToken, maskPhone: maskPhoneNumber(phone) }
              }
          
          } else if(data.authMode == 'otp' && isVerified){
            return { success: true, data: voter, otp: inviteToken, maskPhone: maskPhoneNumber(phone) }
          
          } else {
            return { success: true, data: voter }
          }
        }
        
        return { success: false, data: null }

      } catch (error) {
        console.log(error);
        return { success: false, data: null }
      }

  });


  export const verifyVoterOtpFn = createServerFn({ method: 'POST' }).middleware([arcjetMiddleware]).handler(
    async ({ data }: any) => {
      try {
       
        let [voter] = await db
          .select()
          .from(voters)
          .innerJoin(elections, eq<any>(voters.electionId, elections.id))
          .where(
            and(
              eq<any>(voters.username, data.username), 
              eq<any>(voters.inviteToken, data.otp),
              eq<any>(elections.id, data.electionId)
            )
          )
          .orderBy(asc(voters.id))

        if (voter)
          return { success: true, data: voter }
        return { success: false, data: null }

      } catch (error) {
        console.log(error);
        return { success: false, data: null }
      }
  });


export const fetchGoogleProfileFromServer = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware])
  .handler(async ({ data }: any) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
        },
      });

      if (!response.ok) throw new Error(`Google error status: ${response.status}`);

      const profile = await response.json();
      // Authenticate Voter 
      const [voter] = await db
        .select()
        .from(voters)
        .innerJoin(elections, eq<any>(voters.electionId, elections.id))
        .where(eq<any>(voters.email, profile?.email))
        .orderBy(asc(voters.id));

      if (voter) return { success: true, data: voter, message: null }
      return { success: false, data: null, message: 'Voter is not eligible for this election' }

    } catch (serverError: any) {
      console.error(serverError);
      return { success: false, data: null, message: serverError?.message }
    }
  });

export const uploadVotersFn = createServerFn({ method: 'POST' }).middleware([arcjetMiddleware]).handler(
  async ({ data }: any) => {
    const { voters: rows, duplicateUsernames } = prepareVotersForBulkImport(
      Array.isArray(data) ? data : [],
    );

    if (rows.length === 0) {
      throw new Error("No valid voters to import. Each row needs a username.");
    }

    try {
      const chunks = chunkArray(rows, 500);
      let imported = 0;

      await db.transaction(async (tx) => {
        for (const chunk of chunks) {
          const inserted = await tx
            .insert(voters)
            .values(chunk)
            .onConflictDoUpdate({
              target: [voters.electionId, voters.username],
              set: {
                name: sql`EXCLUDED.name`,
                phoneNumber: sql`EXCLUDED.phone_number`,
                email: sql`EXCLUDED.email`,
              },
            })
            .returning({ id: voters.id });

          imported += inserted.length;
        }
      });

      return {
        success: true,
        imported,
        duplicateUsernames,
        message:
          duplicateUsernames.length > 0
            ? `Imported ${imported} voter(s). Skipped ${duplicateUsernames.length} duplicate username(s) in the spreadsheet (kept the last row for each): ${duplicateUsernames.join(", ")}.`
            : `Imported ${imported} voter(s).`,
      };
    } catch (error: any) {
      const detail = error?.cause?.detail ?? error?.detail;
      console.error("uploadVotersFn error:", detail ?? error?.message ?? error);
      throw new Error(detail || error?.message || "Voter import failed");
    }
  },
);


export const inviteVoterFn = createServerFn({ method: 'GET' }).middleware([arcjetMiddleware]).handler(
  async ({ data: voterId }: any) => {
    try {

      // Fetch Voter
      const [rec] = await db.select()
        .from(voters)
        .innerJoin(elections, eq<any>(voters.electionId, elections.id))
        .where(eq<any>(voters.id, voterId));

      // Send Invite Code via SMS
      const phone = addCountryCode(rec?.voters?.phoneNumber);
      const inviteToken = rec?.voters?.inviteToken;
      const fname = rec?.voters?.name?.split(" ")[0];
      const username = rec?.voters?.username;
      const electionUrl = `${process.env.BETTER_AUTH_URL}/vote/election?page=${rec?.elections?.tag}`
      let smsPayload: any;
      if(rec?.elections?.authMode?.toLowerCase() == 'otp'){
        smsPayload = {
          sender: process.env.SMS_SENDER_ID,
          message: `Hello ${fname}, Your Verification OTP is ${inviteToken} . Visit ${electionUrl} to vote!`,
          recipients: [phone],
        }

      } else {

        smsPayload = {
          sender: process.env.SMS_SENDER_ID,
          message: `Hello ${fname}, Please vote with Username: ${username}, Password: ${inviteToken} . Visit ${electionUrl} to vote!`,
          recipients: [phone],
        };
      }
      
      if (!phone.length) {
        throw new Error(`Phone number is Invalid, ${phone}`);
      }

      const sms: any = await fetch(`${process.env.SMS_API_URL}/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.SMS_API_KEY
        } as any,
        body: JSON.stringify(smsPayload)
      });

      if (!sms.ok) {
        const errorText = await sms.text();
        throw new Error(`SMS API HTTP Error! Status: ${sms.status} - ${errorText}`);
      }

      const resp = await sms.json();
      if (resp) {
        return await db
          .update(voters)
          .set({
            isVerified: true,
          })
          .where(eq<any>(voters.id, voterId)).returning();
      }

    } catch (error: any) {
      console.log(error.message)

    }

    //return await db.select().from(voters).where(eq<any>(voters.id, voterId));
  }
);


export const inviteVoters2Fn = createServerFn({ method: 'GET' }).middleware([arcjetMiddleware]).handler(
  async ({ data: electionId }: any) => {
    try {
      // Fetch Voter
      const rec = await db.select()
        .from(voters)
        .innerJoin(elections, eq<any>(voters.electionId, elections.id))
        .where(eq<any>(elections.id, electionId));

      let mdata: any = {};
      rec.map((r: any) => {
        const phone = addCountryCode(r?.voters?.phoneNumber);
        const inviteToken = r?.voters?.inviteToken;
        const fname = r?.voters?.name?.split(" ")[0];
        const username = r?.voters?.username;
        mdata[phone] = { fname, username, inviteToken }
      })

      // Send Invite Code via SMS
      const electionUrl = `${process.env.BETTER_AUTH_URL}/vote/election?page=${rec[0]?.elections?.tag}`
      const smsPayload: any = {
        sender: process.env.SMS_SENDER_ID,
        message: `Hello <%fname%>, Please vote with Username: <%username%>, Password: <%inviteToken%> . Try and Visit ${electionUrl} to vote!`,
        recipients: mdata,
      };
      
      const sms: any = await fetch(`${process.env.SMS_API_URL}/sms/template/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.SMS_API_KEY
        } as any,
        body: JSON.stringify(smsPayload)
      });

      if (!sms.ok) {
        const errorText = await sms.text();
        throw new Error(`SMS API HTTP Error! Status: ${sms.status} - ${errorText}`);
      }

      const resp = await sms.json();
      if (resp) {
        const { data: mt } = resp;
        const sentInvites = mt?.map((r: any) => ("0" + stripCountryCode(r.recipient)));
        const sentInvitesCodes = mt?.map((r: any) => (r.recipient));
        
        return await db.update(voters).set({ isVerified: true }).where(
          and(
            eq(voters.electionId, electionId),
            or(
              inArray(voters.phoneNumber, sentInvites),
              inArray(voters.phoneNumber, sentInvitesCodes),
            )
          )
        ).returning();
      }

    } catch (error: any) {
      console.log(error.message)
    }
  }
);

export const inviteVoters1Fn = createServerFn({ method: 'GET' }).middleware([arcjetMiddleware]).handler(
  async ({ data: electionId }: any) => {
    try {
      // Fetch Voter
      const rec = await db.select()
        .from(voters)
        .innerJoin(elections, eq<any>(voters.electionId, elections.id))
        .where(
          and(
            eq<any>(elections.id, electionId),
            //eq<any>(voters.isVerified, false)
            eq<any>(voters.hasVoted, false)
          )
        );

      let resp2 = await Promise.all(rec.map( async (r: any) => {

          const phone = addCountryCode(r?.voters?.phoneNumber);
          const inviteToken = r?.voters?.inviteToken;
          const fname = r?.voters?.name?.split(" ")[0];
          const username = r?.voters?.username;
          
          // Send Invite Code via SMS
          const electionUrl = `${process.env.BETTER_AUTH_URL}/vote/election?page=${rec[0]?.elections?.tag}`
          const smsPayload: any = {
            sender: process.env.SMS_SENDER_ID,
            message: `Hello ${fname}, Please vote with Username: ${username}, Password: ${inviteToken} . Try and Visit ${electionUrl} to vote!`,
            recipients: [phone],
          };

          if (!phone?.length || phone?.length < 9) {
            console.log(`Phone number is Invalid, ${phone}`);
            return ({ message: `Phone number is Invalid, ${phone}` });
          }
    
          const sms: any = await fetch(`${process.env.SMS_API_URL}/sms/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': process.env.SMS_API_KEY
            } as any,
            body: JSON.stringify(smsPayload)
          });

          if (!sms.ok) {
            const errorText = await sms.text();
            console.log(`SMS API HTTP Error! Status: ${sms.status} - ${errorText}`)
            return ({ message: `SMS API HTTP Error! Status: ${sms.status} - ${errorText}` });
          }

          const resp = await sms.json();
          console.log("SMS Response: ", resp);
          if (resp) {
            const { data: mt } = resp;
            const sentInvites = mt?.map((r: any) => ("0" + stripCountryCode(r.recipient)));
            const sentInvitesCodes = mt?.map((r: any) => (r.recipient));
            
            return await db.update(voters).set({ isVerified: true }).where(
              and(
                eq(voters.electionId, electionId),
                or(
                  inArray(voters.phoneNumber, sentInvites),
                  inArray(voters.phoneNumber, sentInvitesCodes),
                )
              )
            ).returning();
          }
          return null;
      }))

      // Return SMS response
      return resp2;

    } catch (error: any) {
      console.log(error.message)
    }
  }
);


// Helper Function for Background SMS Queue Processing
const smsQueueTracker = new Map<string, {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  isProcessing: boolean;
}>();


async function processSmsQueueInBackground(rec: any[], electionId: string) {
  const batches = chunkArray(rec, 25); // Smooth 5-record chunks
  const electionTag = rec[0]?.elections?.tag || '';
  const electionUrl = `${process.env.BETTER_AUTH_URL}/vote/election?page=${electionTag}`;

  smsQueueTracker.set(electionId, {
    total: rec.length,
    processed: 0,
    successful: 0,
    failed: 0,
    isProcessing: true,
  });

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (r: any) => {
        const stats = smsQueueTracker.get(electionId)!;
        const phone = addCountryCode(r?.voters?.phoneNumber);
        const inviteToken = r?.voters?.inviteToken;
        const fname = r?.voters?.name?.split(" ")[0];
        const username = r?.voters?.username;

        if (!phone?.length || phone?.length < 9) {
          stats.processed += 1;
          stats.failed += 1;
          smsQueueTracker.set(electionId, { ...stats });
          return;
        }

        const smsPayload = {
          sender: process.env.SMS_SENDER_ID,
          message: `Hello ${fname}, Please vote with Username: ${username}, Password: ${inviteToken}. Visit ${electionUrl} to vote!`,
          recipients: [phone],
        };

        try {
          const sms = await fetchWithRetry(`${process.env.SMS_API_URL}/sms/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': process.env.SMS_API_KEY!
            },
            body: JSON.stringify(smsPayload)
          });

          if (!sms.ok) throw new Error(`HTTP Gateway State Error ${sms.status}`);

          const resp = await sms.json();
          
          if (resp && (resp.status === "success" || resp.code === "1000")) {
            await db.update(voters)
              .set({ isVerified: true })
              .where(
                and(
                  eq<any>(voters.electionId, electionId),
                  eq<any>(voters.phoneNumber, r?.voters?.phoneNumber)
                )
              );
            stats.successful += 1;
          } else {
            stats.failed += 1;
          }
        } catch (err) {
          stats.failed += 1;
          console.error(`Permanent transmission failure to ${phone}:`, err);
        } finally {
          stats.processed += 1;
          smsQueueTracker.set(electionId, { ...stats });
        }
      })
    );
    await wait(1000); // 1s carrier pacing step delay
  }

  const finalStats = smsQueueTracker.get(electionId);
  if (finalStats) {
    smsQueueTracker.set(electionId, { ...finalStats, isProcessing: false });
  }
}

// Fixed Server Function
export const inviteVotersFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ data: electionId }: any) => {
    try {
      const currentJob = smsQueueTracker.get(electionId);
      console.log("Current Job: ", currentJob);
      if (currentJob?.isProcessing) {
        return { success: false, message: "A broadcast is already running for this election." };
      }

      const rec = await db.select()
        .from(voters)
        .innerJoin(elections, eq<any>(voters.electionId, elections.id))
        .where(
          and(
            eq<any>(elections.id, electionId),
            eq<any>(voters.hasVoted, false),
            //eq<any>(voters.isVerified, false)
          )
        );
        console.log("Rec: ", rec);

      if (!rec.length) {
        return { success: true, message: "No pending unverified voters to invite." };
      }
     
      processSmsQueueInBackground(rec, electionId);

      return {
        success: true,
        message: `Queue initiated. Asynchronously processing ${rec.length} voter invitations in the background.`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });


  // Polling Metrics Collector Function
  export const getSmsProgressFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ data: electionId }: any) => {
    return smsQueueTracker.get(electionId) || { isProcessing: false, total: 0, processed: 0, successful: 0, failed: 0 };
 });


export const exportVotersToExcelFn = createServerFn({ method: 'GET' })
   .middleware([arcjetMiddleware])
   .handler(async ({ data }: any) => {
    const { electionId, statusFilter } = data;

    try {
      // 1. Establish core dynamic SQL filter conditions array
      const conditions = [eq(voters.electionId, electionId)];

      // Target specific voting boolean states conditionally 
      if (statusFilter === 'VOTED') {
        conditions.push(eq(voters.hasVoted, true));
      } else if (statusFilter === 'PENDING') {
        conditions.push(eq(voters.hasVoted, false));
      }

      // 2. Fetch full matching registry set using the and-wrapped criteria
      const filteredVoters = await db
        .select({
          name: voters.name,
          username: voters.username,
          phoneNumber: voters.phoneNumber,
          email: voters.email,
          inviteToken: voters.inviteToken,
          hasVoted: voters.hasVoted,
          isVerified: voters.isVerified,
          invitedAt: voters.invitedAt,
        })
        .from(voters)
        .where(and(...conditions));

      if (filteredVoters.length === 0) {
        throw new Error(`No records matching the '${statusFilter.toLowerCase()}' condition were found to export.`);
      }

      // 3. Convert records array into organized worksheet mapping matrices
      const formattedRows = filteredVoters.map((voter) => ({
        'Full Name': voter.name,
        'Access Username': voter.username,
        'Phone Number': voter.phoneNumber,
        'Email Address': voter.email,
        'Invitation Code': voter.inviteToken,
        'Voting Status': voter.hasVoted ? 'Voted' : 'Pending',
        'Account Verified': voter.isVerified ? 'Yes' : 'No',
        'Date Invited': voter.invitedAt ? new Date(voter.invitedAt).toLocaleDateString() : 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Registry');

      worksheet['!cols'] = [
        { wch: 24 }, { wch: 18 }, { wch: 16 }, { wch: 28 },
        { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }
      ];

      const excelBuffer64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const stateLabel = statusFilter.toLowerCase();

      return {
        success: true,
        filename: `election_${electionId}_voters_${stateLabel}_export.xlsx`,
        base64Data: excelBuffer64,
      };
    } catch (error: any) {
      console.error('Server Function Error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to safely compile data structures to Excel.',
        filename: '',
        base64Data: '',
      };
    }
  });


export const deleteVoterFn = createServerFn({ method: 'POST' })
 .middleware([arcjetMiddleware, authMiddleware])
 .handler(
  async ({ context, data: voterId }: any) => {
    const admin: any = context?.user;
    const [ownedVoter] = await db
      .select({ id: voters.id })
      .from(voters)
      .innerJoin(elections, eq(voters.electionId, elections.id))
      .where(and(eq<any>(voters.id, voterId), eq<any>(elections.adminId, admin.id)));
    if (!ownedVoter) {
      throw new Error('Voter not found.');
    }
    return await db.delete(voters).where(eq<any>(voters.id, voterId)).returning();
  }
);



// CAST VOTE BALLOT

// interface CastBallotPayload {
//   voterId: number;
//   electionId: number;
//   selections: {
//     positionId: number;
//     candidateId: number;
//     receiptSignature: string;
//   }[];
// }


// export const castBallotServerFn = createServerFn({ method: 'POST' })
//   .inputValidator((payload: CastBallotPayload) => payload)
//   .handler(async ({ data }: any) => {
//     const { voterId, electionId, selections } = data;

//     console.log(`Initializing atomic ballot transaction for voter node: ${voterId}`);

//     // Execute within an atomic SQL transaction block
//     return await db.transaction(async (tx) => {

//       // 1. CRITICAL SECURITY GUARD: Verify the user has not already voted
//       const [voterRecord] = await tx
//         .select()
//         .from(voters)
//         .where(and(eq<any>(voters.id, voterId), eq<any>(voters.electionId, electionId)))
//         .limit(1);

//       if (!voterRecord) {
//         throw new Error('Voter profile configuration not found.');
//       }

//       if (voterRecord.hasVoted) {
//         throw new Error('Security Breach: This account token has already cast a ballot.');
//       }

//       // 2. BULK INSERTS: If the voter didn't completely abstain, map into the db rows
//       if (selections.length > 0) {
//         const rowsToInsert = selections.map((vote: any) => ({
//           electionId: electionId,
//           positionId: vote.positionId,
//           candidateId: vote.candidateId,
//           receiptSignature: vote.receiptSignature,
//         }));

//         await tx.insert(electionVotes).values(rowsToInsert);
//       }

//       // 3. FLIP ACCOUNT STATE FLAG: Set hasVoted to true to block double voting
//       await tx
//         .update(voters)
//         .set({ hasVoted: true })
//         .where(eq<any>(voters.id, voterId));

//       return { 
//         success: true, 
//         message: "Ballot cleanly parsed and written to immutable transaction log tables." 
//       };
//     });
//   });



export const castBallotServerFn = createServerFn({
  method: "POST",
})
  .middleware([arcjetMiddleware])
  .handler(async ({ data }: any) => {
    const { voterId, electionId, selections, inviteToken } = data;
    const request = getRequest();
    const ip = request?.headers.get('x-forwarded-for')?.split(',')[0] || request?.headers.get('x-real-ip') || '127.0.0.1';

    try {
      // Execute the entire ballot block inside an atomic SQL transaction isolation container
      const result = await db.transaction(async (tx) => {

        // 1. Critical Concurrency Guard: Fetch the voter and place an exclusive row-level lock (FOR UPDATE)
        // This stops two parallel automated fetch cycles from registering rapid spam requests simultaneously
        const [voterCheck] = await tx
          .select()
          .from(voters)
          .where(
            and(
              eq<any>(voters.id, voterId),
              eq<any>(voters.electionId, electionId)
            )
          )
          .for('update'); // Exclusive Postgres row lock engine trigger

        // 2. Fallback defensive structural intercept check
        if (!voterCheck) {
          throw new Error("Voter registration identity record not found for this election.");
        }

        // 3. CRITICAL SECURITY GUARD: Re-verify the voter's OTP/password secret server-side.
        // Prevents anyone who merely guesses a voterId from casting a ballot on someone else's behalf.
        if (!inviteToken || voterCheck.inviteToken !== inviteToken) {
          throw new Error("Security Alert: Invalid voter credential. Please sign in again.");
        }

        if (voterCheck.hasVoted) {
          throw new Error("Security Alert: This voter credential index has already cast a ballot.");
        }

        // 4. Batch insert the ballot selections, each stamped with a real server-generated signature
        const signatureTimestamp = new Date().toISOString();
        const ballotPayloads = selections.map((vote: any) => ({
          electionId: electionId,
          positionId: vote.positionId,
          candidateId: vote.candidateId, // If null, writes gracefully to Postgres to log an intentional Abstention
          receiptSignature: generateBallotReceiptSignature({
            electionId,
            positionId: vote.positionId,
            candidateId: vote.candidateId ?? 0,
            timestamp: signatureTimestamp,
          }),
        }));

        await tx.insert(electionVotes).values(ballotPayloads);

        // 4. Close and lock the voting gate immediately
        await tx
          .update(voters)
          .set({ hasVoted: true, voteIp: ip })
          .where(eq<any>(voters.id, voterId));

        return { success: true };
      });
      return result;

    } catch (error) {
      console.error("[CRITICAL DB BALLOT EXCEPTION]:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "An unexpected server database transaction error occurred.",
      };
    }
  });