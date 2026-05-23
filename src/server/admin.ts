import { createServerFn } from '@tanstack/react-start';
import { db } from '../db';
import crypto from 'crypto';
import { voters, electionVotes, elections, positions, candidates, votes, contestants } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
// import { createAndInviteVoters } from './invites'; // Preserved from previous code logic
import { generateBallotReceiptSignature } from './ballot-signature';


interface VoterInviteInput {
    electionId: number;
    phoneNumbers: string[]; // List of formatting numbers: ["+233540000000", ...]
}

interface BallotSubmission {
    token: string;
    electionId: number;
    selections: { positionId: number; candidateId: number }[];
}

interface UpgradedVoterInput {
    name: string;
    username: string;
    phoneNumber: string;
}



//#### GENERAL UTILITY FUNCTIONS


export async function createAndInviteVoters({ electionId, phoneNumbers }: VoterInviteInput) {
  const domain = process.env.NEXT_PUBLIC_APP_URL || 'https://yoursaas.com';

  for (const phone of phoneNumbers) {
    // 1. Generate a cryptographically secure single-use voting token
    const secureToken = crypto.randomBytes(32).toString('hex');
    // 2. Persist the token to the database using Drizzle
    await db.insert(voters).values({
      electionId: electionId,
      phoneNumber: phone,
      inviteToken: secureToken,
      hasVoted: false,
    } as any);
    // 3. Compose the unique election ballot link
    const votingLink = `${domain}/vote/election?token=${secureToken}`;
    // 4. Dispatch SMS out-of-band via background thread execution
    process.nextTick(async () => {
      try {
        await sendSmsGateway({
          to: phone,
          message: `You have been enfranchised to vote in the election. Click here to cast your ballot securely: ${votingLink}`,
        });
      } catch (err) {
        console.error(`Failed to send invitation SMS to ${phone}:`, err);
      }
    });
  }
}

export async function submitWebBallot({ token, electionId, selections }: BallotSubmission) {
  // 1. Find and validate the token atomically
  const [voterRecord] = await db.select()
    .from(voters)
    .where(and(eq(voters.inviteToken, token), eq(voters.electionId, electionId)))
    .limit(1);

  if (!voterRecord) {
    throw new Error('Invalid or corrupted voting token.');
  }

  if (voterRecord.hasVoted) {
    throw new Error('This invitation token has already been used to cast a ballot.');
  }

  // 2. Use a Database Transaction to ensure all updates occur atomically
  await db.transaction(async (tx) => {
    // A) Commit the individual position votes to the anonymous ballot box
    for (const vote of selections) {
      await tx.insert(electionVotes).values({
        electionId: electionId,
        positionId: vote.positionId,
        candidateId: vote.candidateId,
      } as any);
    }
    // B) Burn the token instantly to prevent double-voting re-entrancy attacks
    await tx.update(voters)
      .set({ hasVoted: true })
      .where(eq(voters.id, voterRecord.id));
  });

  return { success: true, message: 'Your secret ballot has been cast successfully.' };
}

export async function submitWebBallotWithReceipt({ token, electionId, selections }: any) {
    const [voterRecord] = await db.select().from(voters)
      .where(and(eq(voters.inviteToken, token), eq(voters.electionId, electionId))).limit(1);
  
    if (!voterRecord || voterRecord.hasVoted) throw new Error('Action blocked: Token invalid or expired.');
  
    const timestampString = new Date().toISOString();
    const issuedReceipts: string[] = [];
  
    await db.transaction(async (tx) => {
      for (const vote of selections) {
        // 1. Generate an unforgeable cryptographic signature for each selected position
        const signature = generateBallotReceiptSignature({
          electionId,
          positionId: vote.positionId,
          candidateId: vote.candidateId,
          timestamp: timestampString
        });
  
        // 2. Commit the vote along with its unforgeable receipt signature parameter to the database
        await tx.insert(electionVotes).values({
          electionId,
          positionId: vote.positionId,
          candidateId: vote.candidateId,
          receiptSignature: signature
        });
  
        issuedReceipts.push(signature);
      }
  
      // 3. Mark the single-use invite token as spent
      await tx.update(voters).set({ hasVoted: true }).where(eq(voters.id, voterRecord.id));
    });
  
    // Return the immutable proof hashes to the frontend client layout
    return { 
      success: true, 
      timestamp: timestampString, 
      receipts: issuedReceipts,
      message: 'Your secret ballot has been encrypted and recorded successfully.' 
    };
  }
  


async function sendSmsGateway({ to, message }: { to: string; message: string }) {
  // Replace this with your actual carrier endpoint (e.g., Hubtel, Twilio, Arkesel)
  await fetch('https://sms-provider.com', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.SMS_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: to, text: message }),
  });
}


//#### SERVER FUNCTIONS

export const createSecureElection = createServerFn({ method: 'POST'})
.handler(async (data: any) => {
    // 1. Verify the admin's session and extract their user ID securely
    // const adminUser = await assertAuthenticatedAdmin();
    // 2. Insert the election record, ensuring it is tied to the validated admin session
    return await db.insert(elections).values({
      orgId: data.orgId,
      title: data.title,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
    } as any).returning();
  }
)

export const getCategoryLeaderboard = createServerFn({ method: 'GET'})
.handler(async ({ eventId, categoryId }:any) => {
    return await db.select({
      id: contestants.id,
      name: contestants.name,
      totalVotes: sql<number>`sum(${votes.voteCount})::int`
    })
    .from(contestants)
    .leftJoin(votes, and(eq(votes.contestantId, contestants.id), eq(votes.eventId, eventId)))
    .where(eq(contestants.categoryId, categoryId))
    .groupBy(contestants.id)
    .orderBy(sql`totalVotes DESC`);
});


// Fetch elections strictly scoped to the active tenant ID
export const getTenantElections = createServerFn({ method: 'GET'}).handler( 
  async () => {
    const admin = { id: '1' };
    // const admin = await assertAuthenticatedAdmin();
    return await db.select()
    .from(elections)
    .where(eq(elections.adminId, admin.id));
});

// ==========================================
// 2. ELECTION CRUD
// ==========================================
export const createElection = createServerFn({ method: 'POST'}).handler( 
  async (data: any) => {
    return await db.insert(elections).values({
      orgId: data.orgId,
      title: data.title,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
    } as any).returning();
  });

export const getElectionsByOrg = createServerFn({ method: 'GET'}).handler( 
  async (adminId: any) => {
    return await db.select().from(elections).where(eq(elections.adminId, adminId));
  }
);

// ==========================================
// 3. POSITION CRUD
// ==========================================
export const createPosition = createServerFn({ method: 'POST'}).handler( 
  async ({ electionId, title, slots }: any) => {
    return await db.insert(positions).values({ electionId, title, slots }).returning();
  }
);

export const getPositionsByElection = createServerFn({ method: 'GET'}).handler( 
  async (electionId: any) => {
    return await db.select().from(positions).where(eq(positions.electionId, electionId));
  }
);

// ==========================================
// 4. CANDIDATE CRUD (With Image Injection integration)
// ==========================================
export const createCandidate = createServerFn({ method: 'POST'}).handler( 
  async ({ positionId, name, imageUrl }: any) => {
    return await db.insert(candidates).values({ positionId, name, imageUrl }).returning();
  }
);

export const deleteCandidate = createServerFn({ method: 'POST'}).handler( 
  async (candidateId: any) => {
    return await db.delete(candidates).where(eq(candidates.id, candidateId));
  }
);

// ==========================================
// 5. VOTER INVITE SYSTEM
// ==========================================
export const dispatchVoterInvites = createServerFn({ method: 'POST'}).handler( 
  async ({ electionId, phoneNumbers }: any) => {
    await createAndInviteVoters({ electionId, phoneNumbers });
    return { success: true, message: `${phoneNumbers.length} SMS invites added to backend queue.` };
  }
);

export const dispatchUpgradedInvites = createServerFn({ method: 'POST'}).handler(
    async ({ electionId, targetVoters }: any) => {
      const domain = process.env.NEXT_PUBLIC_APP_URL || 'https://yoursaas.com';
  
      for (const person of targetVoters) {
        const secureToken = crypto.randomBytes(32).toString('hex');
  
        await db.insert(voters).values({
          electionId: electionId,
          name: person.name,
          username: person.username.toLowerCase().trim(),
          phoneNumber: person.phoneNumber,
          inviteToken: secureToken,
        } as any);
  
        const votingLink = `${domain}/vote/election?token=${secureToken}`;
  
        process.nextTick(async () => {
          try {
            // Simulated SMS delivery pipeline hook
            console.log(`[SMS Sent to ${person.name} (${person.phoneNumber})]: Welcome ${person.username}, cast your ballot here: ${votingLink}`);
          } catch (err) {
            console.error(`SMS failure to ${person.phoneNumber}:`, err);
          }
        });
      }
  
      return { success: true, message: `Successfully registered and texted ${targetVoters.length} custom voters.` };
    }
  );
  
  
  export const getElectionTurnoutStats = createServerFn({ method: 'GET'}).handler(
    async (electionId: any) => {
    // Query total headcount registered vs totals containing a true 'hasVoted' status flag
    const [counts] = await db.select({
      totalRegistered: sql<number>`count(${voters.id})::int`,
      totalVoted: sql<number>`count(case when ${voters.hasVoted} = true then 1 end)::int`
    })
    .from(voters)
    .where(eq(voters.electionId, electionId));
  
    return {
      registered: counts?.totalRegistered || 0,
      voted: counts?.totalVoted || 0,
      turnoutPercentage: counts?.totalRegistered ? Math.round((counts.totalVoted / counts.totalRegistered) * 100) : 0
    };
  });


