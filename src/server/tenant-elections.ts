import { createServerFn } from '@tanstack/react-start';
import { elections, user, positions, candidates, voters, electionVotes } from '../db/schema';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db';
import { BUCKET_NAME, s3Client } from '#/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { stripCountryCode } from '#/lib/utils';


// ELECTIONS FUNCTIONS

export const getElectionsFn = createServerFn({ method: 'GET'}).handler( 
  async () => {
    const admin = { id: '1' };
    // const admin = await assertAuthenticatedAdmin();
    return await db.select()
    .from(elections)
    .where(eq(elections.adminId, admin.id));
});

export const getElectionFn = createServerFn({ method: 'GET'}).handler( 
  async ({ data: electionId }: any) => {
    return await db.select().from(elections).where(eq(elections.id, electionId));
  }
);

export const getElectionDataFn = createServerFn({ method: 'GET'}).handler( 
  async ({ data: electionId }: any) => {
   
  try {
    // Queries database matching positions to your raw election id parameter
    const ballotData:any = await db.query.positions.findMany({
      where: eq(positions.electionId, electionId),
      orderBy: [asc(positions.order)],
      with: {
        candidates: {
          where: (candidates: any, { eq }: any) => eq(candidates.isActive, true),
          orderBy: (candidates: any, { asc }:any) => [asc(candidates.order)],
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


export const getActiveElectionsFn = createServerFn({ method: 'GET'}).handler( 
  async () => {
    // const admin = await assertAuthenticatedAdmin();
    return await db.select()
    .from(elections)
    .where(eq(elections.isActive, true));
});


export const createElectionFn = createServerFn({ method: 'POST'}).handler( 
  async ({ data }: any) => {
    return await db.insert(elections).values({ 
      title: data.title, 
      adminId: '1', 
      tag: data.tag, 
      imageUrl: data.imageUrl, 
      billVoters: data.billVoters, 
      authMode: data.authMode, 
      makePublic: data.makePublic, 
      showFeed: data.showFeed, 
      isActive: data.isActive, 
      description: data.description, 
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt)
    }).returning();
  }
);

export const updateElectionFn = createServerFn({ method: 'POST'}).handler( 
  async ({ data }: any) => {
    return await db
    .update(elections)
    .set({ 
      title: data.title, 
      tag: data.tag, 
      imageUrl: data.imageUrl, 
      billVoters: data.billVoters, 
      authMode: data.authMode, 
      makePublic: data.makePublic, 
      showFeed: data.showFeed, 
      isActive: data.isActive, 
      description: data.description, 
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt)
    })
    .where(eq(elections.id, data.id)).returning();
});


export const deleteElectionFn = createServerFn({ method: 'POST'}).handler( 
  async ({ data: electionId }: any) => {
    return await db.delete(elections).where(eq(elections.id, electionId)).returning();
  }
);



export const getElectionOverview = createServerFn({
  method: "GET",
})
  .handler(async ({ data: electionId }): Promise<any> => {
    // 1. Fetch primary election properties from the 'elections' table core node
    const [electionRecord] = await db
      .select()
      .from(elections)
      .where(eq(elections.id, electionId));

    if (!electionRecord) {
      throw new Error(`Election resource instance with ID [${electionId}] was not discovered.`);
    }

    // 2. Execute optimal high-concurrency sub-table count aggregations concurrently
    const [
      [positionsCountResult],
      [candidatesCountResult],
      [votersCountResult],
      [votesCountResult],
    ] = await Promise.all([
      // Count positions linked to this election instance
      db
        .select({ count: sql<number>`count(${positions.id})::int` })
        .from(positions)
        .where(eq(positions.electionId, electionId)),

      // Count candidates linked to this election by joining through positions
      db
        .select({ count: sql<number>`count(${candidates.id})::int` })
        .from(candidates)
        .innerJoin(positions, eq(candidates.positionId, positions.id))
        .where(eq(positions.electionId, electionId)),

      // Count eligible registered voters enrolled for this election index
      db
        .select({ count: sql<number>`count(${voters.id})::int` })
        .from(voters)
        .where(eq(voters.electionId, electionId)),

      // Count total digital cryptographic ballots cast
      db
        .select({ count: sql<number>`count(${electionVotes.id})::int` })
        .from(electionVotes)
        .where(eq(electionVotes.electionId, electionId)),
    ]);

    return {
      id: electionRecord.id,
      tag: electionRecord.tag,
      title: electionRecord.title,
      description: electionRecord.description,
      // Standardizing JavaScript native Date timestamps cleanly to localized string strings
      startAt: electionRecord.startAt.toISOString(),
      endAt: electionRecord.endAt.toISOString(),
      authMode: electionRecord.authMode ?? "OTP",
      isActive: electionRecord.isActive,
      counts: {
        positions: positionsCountResult?.count ?? 0,
        candidates: candidatesCountResult?.count ?? 0,
        voters: votersCountResult?.count ?? 0,
        votesCast: votesCountResult?.count ?? 0,
      },
    };
  });




 export const getUnifiedElectionTelemetry = createServerFn({
    method: "GET",
  })
    .handler(async ({ data: electionId }): Promise<any> => {
      
      // Execute data retrieval paths concurrently using Promise.all to maximize pipeline throughput
      const [
        [electionRecord], 
        [votersCountResult],
        rawPositions, 
        rawCandidateTallies, 
        rawRecentVotes
      ] = await Promise.all([
        
        // Query 1: Fetch primary election properties from the 'elections' table core node
        db
          .select()
          .from(elections)
          .where(eq(elections.id, electionId)),
  
        // Query 2: Count eligible registered voters enrolled for this election index
        db
          .select({ count: sql<number>`count(${voters.id})::int` })
          .from(voters)
          .where(eq(voters.electionId, electionId)),
  
        // Query 3: Fetch structural portfolios matching this active election ID
        db
          .select()
          .from(positions)
          .where(eq(positions.electionId, electionId)),
  
        // Query 4: Aggregate candidate results via outer grouping joins directly inside SQL nodes
        db
          .select({
            id: candidates.id,
            name: candidates.name,
            imageUrl: candidates.imageUrl,
            positionId: candidates.positionId,
            order: candidates.order,
            voteCount: sql<number>`count(${electionVotes.id})::int`,
          })
          .from(candidates)
          .innerJoin(positions, eq(candidates.positionId, positions.id))
          .leftJoin(electionVotes, eq(electionVotes.candidateId, candidates.id))
          .where(eq(positions.electionId, electionId))
          .groupBy(candidates.id, candidates.name, candidates.imageUrl, candidates.positionId, candidates.order)
          .orderBy(asc(candidates.order), desc(sql`count(${electionVotes.id})`)),
  
        // Query 5: Fetch the 15 most recent real-time voting audit entries from the ledger
        db
          .select({
            id: electionVotes.id,
            positionTitle: positions.title,
            candidateName: candidates.name,
            createdAt: electionVotes.createdAt,
          })
          .from(electionVotes)
          .innerJoin(positions, eq(electionVotes.positionId, positions.id))
          .innerJoin(candidates, eq(electionVotes.candidateId, candidates.id))
          .where(eq(electionVotes.electionId, electionId))
          .orderBy(desc(electionVotes.createdAt))
          .limit(15)
      ]);
  
      if (!electionRecord) {
        throw new Error(`Election resource instance with ID [${electionId}] was not discovered.`);
      }
  
      // Helper Utility 1: Mask sensitive phone strings or crypto keys securely
      const generateVoterMask = (index: number): string => {
        return `voter_id_****_${1000 + (index % 9000)}`;
      };
  
      // Helper Utility 2: Format elapsed runtime timestamps
      const formatElapsedTime = (pastDate: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - pastDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        return `${diffHours}h ago`;
      };
  
      // 4. Group and structure candidate tallies by their respective position blocks
      const formattedTallies: any[] = rawPositions.map((pos) => {
        const positionCandidates = rawCandidateTallies
          .filter((cand) => cand.positionId === pos.id)
          .map((cand) => ({
            id: cand.id,
            name: cand.name,
            imageUrl: cand.imageUrl ?? "",
            votes: cand.voteCount,
          }));
  
        const totalVotesForPosition = positionCandidates.reduce((sum, c) => sum + c.votes, 0);
  
        return {
          id: pos.id,
          title: pos.title,
          slots: pos.slots,
          totalVotesForPosition,
          candidates: positionCandidates,
        };
      });
  
      // 5. Structure masked ledger row sequences safely
      const formattedLedger: any[] = rawRecentVotes.map((log, index) => ({
        id: `tx_${log.id}`,
        positionTitle: `${log.positionTitle} (${log.candidateName})`,
        voterMask: generateVoterMask(log.id + index), 
        channel: "WEB", 
        timestamp: formatElapsedTime(log.createdAt),
      }));
  
      return {
        electionDetails: {
          title: electionRecord.title,
          tag: electionRecord.tag,
          totalEligibleVoters: votersCountResult?.count ?? 0
        },
        tallies: formattedTallies,
        auditLedger: formattedLedger,
      };
    });


    // POSITION FUNCTIONS

    export const getPositionsListFn = createServerFn({ method: 'GET'}).handler( 
      async () => {
        const admin = { id: '1' };
        // const admin = await assertAuthenticatedAdmin();
        return await db.select()
        .from(positions)
        .innerJoin(elections, eq(positions.electionId, elections.id))
        .where(eq(elections.adminId, admin.id))
        .orderBy(asc(positions.order), asc(positions.createdAt));
    });
    
    export const getPositionsFn = createServerFn({ method: 'GET' }).handler(
      async () => {
        const admin = { id: '1' };
        // const admin = await assertAuthenticatedAdmin();
    
        return await db
          .select({
            position: positions,
            election: elections,
            candidatesCount: sql<number>`count(${candidates.id})::int`,
          })
          .from(positions)
          .innerJoin(elections, eq(positions.electionId, elections.id))
          .leftJoin(candidates, eq(candidates.positionId, positions.id))
          .where(eq(elections.adminId, admin.id))
          .groupBy(positions.id, elections.id)
          .orderBy(asc(positions.id));
      }
    );

    export const getPositionFn = createServerFn({ method: 'GET'}).handler( 
      async ({ data: positionId }: any) => {
        return await db.select().from(positions).where(eq(positions.id, positionId));
      }
    );
    
    export const createPositionFn = createServerFn({ method: 'POST'}).handler( 
      async ({ data }: any) => {
        return await db.insert(positions).values({ 
          electionId: data.electionId, 
          order: data.order, 
          title: data.title, 
          slots: data.slots, 
        }).returning();
      }
    );
    
    export const updatePositionFn = createServerFn({ method: 'POST'}).handler( 
      async ({ data }: any) => {
        return await db
        .update(positions)
        .set({ 
          electionId: data.electionId, 
          order: data.order, 
          title: data.title, 
          slots: data.slots, 
        })
        .where(eq(positions.id, data.id)).returning();
    });
    
    
    export const deletePositionFn = createServerFn({ method: 'POST'}).handler( 
      async ({ data: positionId }: any) => {
        return await db.delete(positions).where(eq(positions.id, positionId)).returning();
      }
    );


    // CANDIDATES FUNCTIONS

    export const getCandidatesFn = createServerFn({ method: 'GET'}).handler( 
      async () => {
        const admin = { id: '1' };
        // const admin = await assertAuthenticatedAdmin();
        return await db.select()
        .from(candidates)
        .leftJoin(positions, eq(candidates.positionId, positions.id))
        .leftJoin(elections, eq(positions.electionId, elections.id))
        .where(eq(elections.adminId, admin.id))
        .orderBy(asc(positions.order), asc(positions.createdAt),asc(candidates.order));
    });
    
    
    export const getCandidateFn = createServerFn({ method: 'GET'}).handler( 
      async ({ data: candidateId }: any) => {
        return await db.select().from(candidates).where(eq(candidates.id, candidateId));
      }
    );
    
    export const createCandidateFn = createServerFn({ method: 'POST'}).handler( 
      async ({ data }: any) => {

        try {

          let finalAvatarUrl: string | undefined = undefined;
          const file = data.get("image") as File | null;
          
          if (file && file.size > 0) {
              const arrayBuffer = await file.arrayBuffer();
              const rawBuffer = Buffer.from(arrayBuffer);
              const optimizedBuffer = await sharp(rawBuffer)
                .resize(800, 800, { fit: "inside", withoutEnlargement: true }) // Caps size at 800px max width/height
                .webp({ quality: 75 }) // Converts to modern WebP format at 75% quality optimization
                .toBuffer();
              // Enforce the new optimal webp file path structure
              const uniqueFileName = `candidates/${crypto.randomUUID()}.webp`;
                  
              // Upload to S3/R2
              await s3Client.send(
                new PutObjectCommand({
                  Bucket: BUCKET_NAME,
                  Key: uniqueFileName,
                  Body: optimizedBuffer,
                  ContentType: "image/webp",
                  CacheControl: "public, max-age=31536000, immutable", 
                })
              );
        
              // ## R2 CLOUD
              const publicDomain = process.env.R2_PUBLIC_DOMAIN; 
              finalAvatarUrl = `${publicDomain}/${uniqueFileName}`;
           }

           // Return Response
           return await db.insert(candidates).values({ 
              positionId: data.get("positionId") as number, 
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
    
    export const updateCandidateFn = createServerFn({ method: 'POST'}).handler( 
      async ({ data }: any) => {
        
        try {

            let finalAvatarUrl: string | undefined = undefined;
            const file = data.get("image") as File | null;
            if (file && file.size > 0) {
                // const fileExtension = file.name.split(".").pop();
                // const uniqueFileName = `candidates/${crypto.randomUUID()}.${fileExtension}`;
                 const arrayBuffer = await file.arrayBuffer();
                const rawBuffer = Buffer.from(arrayBuffer);
                const optimizedBuffer = await sharp(rawBuffer)
                  .resize(800, 800, { fit: "inside", withoutEnlargement: true }) // Caps size at 800px max width/height
                  .webp({ quality: 75 }) // Converts to modern WebP format at 75% quality optimization
                  .toBuffer();
                // Enforce the new optimal webp file path structure
                const uniqueFileName = `candidates/${crypto.randomUUID()}.webp`;
                    
                // Upload to IDrive e2
                await s3Client.send(
                  new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: uniqueFileName,
                    Body: optimizedBuffer,
                    ContentType: "image/webp",
                    // ContentType: file.type,
                    CacheControl: "public, max-age=31536000, immutable", 
                  })
                );
          
                // ## IDRIVE
                // const endpointHost = process.env.IDRIVE_ENDPOINT!.replace("https://", "");
                // finalAvatarUrl = `https://${BUCKET_NAME}.${endpointHost}/${uniqueFileName}`;
                
                // ## R2 CLOUD
                const publicDomain = process.env.R2_PUBLIC_DOMAIN; 
                finalAvatarUrl = `${publicDomain}/${uniqueFileName}`;
             }

             // Return Response
             return await db
             .update(candidates)
             .set({ 
               positionId: data.get("positionId") as number, 
               order: data.get("order") as number, 
               name: data.get("name") as string, 
               teaser: data.get("teaser") as string, 
               isActive: data.get("isActive") as boolean, 
               ...(finalAvatarUrl && { imageUrl: finalAvatarUrl })
             })
             .where(eq(candidates.id, Number(data.get("id")))).returning();
        
        } catch (error) {
          console.log(error)
        }
    });
    
    
    export const deleteCandidateFn = createServerFn({ method: 'POST'}).handler( 
      async ({ data: candidateId }: any) => {
        return await db.delete(candidates).where(eq(candidates.id, candidateId)).returning();
      }
    );


     // VOTERS FUNCTIONS

     export const getVotersListFn = createServerFn({ method: 'GET'}).handler( 
      async () => {
        const admin = { id: '1' };
        // const admin = await assertAuthenticatedAdmin();
        return await db.select()
        .from(voters)
        .innerJoin(elections, eq(positions.electionId, elections.id))
        .where(eq(elections.adminId, admin.id))
        .orderBy(asc(positions.order), asc(positions.createdAt));
    });
    
    export const getVotersFn = createServerFn({ method: 'GET' }).handler(
      async () => {
        const admin = { id: '1' };
        // const admin = await assertAuthenticatedAdmin();
    
        return await db
          .select()
          .from(voters)
          .innerJoin(elections, eq(voters.electionId, elections.id))
          .where(eq(elections.adminId, admin.id))
          .orderBy(asc(voters.id));
        }
    );

    export const getVoterFn = createServerFn({ method: 'GET'}).handler( 
      async ({ data: voterId }: any) => {
        return await db.select().from(voters).where(eq(voters.id, voterId));
      }
    );

    export const getElectionByTagFn = createServerFn({ method: 'GET'}).handler( 
      async ({ data: tag }: any) => {
        return await db.select().from(elections).where(eq(elections.tag, tag));
      }
    );

    
    
    export const createVoterFn = createServerFn({ method: 'POST'}).handler( 
      async ({ data }: any) => {
        return await db.insert(voters).values({ 
          electionId: data.electionId, 
          name: data.name, 
          username: data.username, 
          phoneNumber: data.phoneNumber, 
          email: data.email,
          inviteToken: data.inviteToken, 
          isVerified: data.isVerified, 
        } as any).returning();
      }
    );
    
    export const updateVoterFn = createServerFn({ method: 'POST'}).handler( 
      async ({ data }: any) => {
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
        .where(eq(voters.id, data.id)).returning();
    });


    export const verifyVoterFn = createServerFn({ method: 'POST'}).handler( 
      async ({ data }: any) => {
        try {
          const [ voter ] = await db
              .select()
              .from(voters)
              .innerJoin(elections, eq(voters.electionId, elections.id))
              .where(and(eq(voters.username, data.username), eq(voters.inviteToken, data.password || data.phone)))
              .orderBy(asc(voters.id));
          
              console.log(voter);
          
          if(voter) {
            return { success: true, data: voter }
          }

          return { success: false, data: null }
          
        } catch (error) {
          console.log(error);
          return { success: false, data: null }
        }
       
    });


    export const uploadVotersFn = createServerFn({ method: 'POST'}).handler( 
      async ({ data }: any) => {
        try {
           return await db.insert(voters).values(data).onConflictDoNothing().returning();
        } catch (error: any) {
          console.log(error.message)
        }
       
      }
    );
   

    export const inviteVoterFn = createServerFn({ method: 'GET'}).handler( 
      async ({ data: voterId }: any) => {
        try {
          
          // Fetch Voter
            const [ rec ] = await db.select()
            .from(voters)
            .innerJoin(elections, eq(voters.electionId, elections.id))
            .where(eq(voters.id, voterId));

            // Send Invite Code via SMS
            const phone = rec?.voters?.phoneNumber.replaceAll("+","").replaceAll(" ","0");
            const inviteToken = rec?.voters?.inviteToken;
            const fname = rec?.voters?.name?.split(" ")[0];
            const username = rec?.voters?.username;
            const electionUrl = `${process.env.BETTER_AUTH_URL}/vote/election?page=${rec?.elections?.tag}`
            const smsPayload: any = {
              sender: process.env.SMS_SENDER_ID,
              message: `Hello ${fname}, Please vote with Username: ${username}, Password: ${inviteToken} . Visit ${electionUrl} to vote!`,
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
            if(resp) {
              return await db
              .update(voters)
              .set({ 
                isVerified: true, 
              })
              .where(eq(voters.id, voterId)).returning();
            }
            
        } catch (error: any) {
          console.log(error.message)
          
        }
        
        //return await db.select().from(voters).where(eq(voters.id, voterId));
      }
    );


    export const inviteVotersFn = createServerFn({ method: 'GET'}).handler( 
      async ({ data: electionId }: any) => {
        try {
          
          // Fetch Voter
            const rec = await db.select()
            .from(voters)
            .innerJoin(elections, eq(voters.electionId, elections.id))
            .where(eq(elections.id, electionId));

            let mdata: any = {};
            rec.map((r: any) => {
                let phone = r?.voters?.phoneNumber.replaceAll("+","").replaceAll(" ","0");
                    // phone = phone.startsWith("0") ? 
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
            if(resp) {
              const { data: mt } = resp;
              const sentInvites = mt?.map((r: any) => ("0"+stripCountryCode(r.recipient)));
              return await db.update(voters).set({ isVerified: false }).where(inArray(voters.phoneNumber, sentInvites)).returning();
            }
            
        } catch (error: any) {
          console.log(error.message)
        }
      }
    );

    
    export const deleteVoterFn = createServerFn({ method: 'POST'}).handler( 
      async ({ data: voterId }: any) => {
        return await db.delete(voters).where(eq(voters.id, voterId)).returning();
      }
    );



    // CAST VOTE BALLOT

    interface CastBallotPayload {
      voterId: number;
      electionId: number;
      selections: {
        positionId: number;
        candidateId: number;
        receiptSignature: string;
      }[];
    }
    
    
    export const castBallotServerFn = createServerFn({ method: 'POST' })
      .inputValidator((payload: CastBallotPayload) => payload)
      .handler(async ({ data }: any) => {
        const { voterId, electionId, selections } = data;
    
        console.log(`Initializing atomic ballot transaction for voter node: ${voterId}`);
    
        // Execute within an atomic SQL transaction block
        return await db.transaction(async (tx) => {
          
          // 1. CRITICAL SECURITY GUARD: Verify the user has not already voted
          const [voterRecord] = await tx
            .select()
            .from(voters)
            .where(and(eq(voters.id, voterId), eq(voters.electionId, electionId)))
            .limit(1);
    
          if (!voterRecord) {
            throw new Error('Voter profile configuration not found.');
          }
    
          if (voterRecord.hasVoted) {
            throw new Error('Security Breach: This account token has already cast a ballot.');
          }
    
          // 2. BULK INSERTS: If the voter didn't completely abstain, map into the db rows
          if (selections.length > 0) {
            const rowsToInsert = selections.map((vote: any) => ({
              electionId: electionId,
              positionId: vote.positionId,
              candidateId: vote.candidateId,
              receiptSignature: vote.receiptSignature,
            }));
    
            await tx.insert(electionVotes).values(rowsToInsert);
          }
    
          // 3. FLIP ACCOUNT STATE FLAG: Set hasVoted to true to block double voting
          await tx
            .update(voters)
            .set({ hasVoted: true })
            .where(eq(voters.id, voterId));
    
          return { 
            success: true, 
            message: "Ballot cleanly parsed and written to immutable transaction log tables." 
          };
        });
      });