import { addCountryCode, buildElectionVoteUrl, chunkArray, fetchWithRetry, wait } from '../lib/utils';
import type { voters } from '../db/schema';

type PendingVoter = typeof voters.$inferSelect;

type ReminderStats = {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  isProcessing: boolean;
};

// Separate from tenant-elections.ts's own smsQueueTracker (invites) so a
// reminder broadcast and an invite broadcast for the same election never
// clobber each other's progress in the same map slot.
const reminderQueueTracker = new Map<string, ReminderStats>();

export function getReminderProgress(electionId: string): ReminderStats {
  return reminderQueueTracker.get(electionId) || { total: 0, processed: 0, successful: 0, failed: 0, isProcessing: false };
}

export function isReminderJobRunning(electionId: string): boolean {
  return !!reminderQueueTracker.get(electionId)?.isProcessing;
}

function hoursRemainingLabel(endAt: Date): string {
  const hours = Math.round((new Date(endAt).getTime() - Date.now()) / (1000 * 60 * 60));
  return hours > 0 ? `${hours} hour${hours === 1 ? '' : 's'}` : 'soon';
}

// Nudges every voter who hasn't cast a ballot yet. Deliberately no
// credentials in the message (this is a reminder, not an invite) -- just
// their first name, the voting link, and how many hours are left before the
// polls close. Caller (sendVoterRemindersFn) is responsible for validating
// the election is live and fetching the pending-voter list -- this function
// only does the actual batched sending, mirroring how
// processSmsQueueInBackground relates to inviteVotersFn.
export async function runVoterReminderWorkflow(
  pendingVoters: PendingVoter[],
  election: { title: string; tag: string; endAt: Date; aliasUrl?: string | null },
  electionId: string,
): Promise<void> {
  const electionUrl = buildElectionVoteUrl(election);

  reminderQueueTracker.set(electionId, {
    total: pendingVoters.length,
    processed: 0,
    successful: 0,
    failed: 0,
    isProcessing: true,
  });

  const batches = chunkArray(pendingVoters, 25);

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (voter) => {
        const stats = reminderQueueTracker.get(electionId)!;
        const phone = addCountryCode(voter.phoneNumber);
        const firstName = voter.name?.split(' ')[0] || 'there';

        if (!phone?.length || phone.length < 9) {
          stats.processed += 1;
          stats.failed += 1;
          reminderQueueTracker.set(electionId, { ...stats });
          return;
        }

        const message = `Hi ${firstName}, this is a reminder to vote in ${election.title}. Voting closes in ${hoursRemainingLabel(election.endAt)}. Cast your ballot: ${electionUrl}`;

        try {
          const sms = await fetchWithRetry(`${process.env.SMS_API_URL}/sms/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': process.env.SMS_API_KEY!,
            },
            body: JSON.stringify({
              sender: process.env.SMS_SENDER_ID,
              message,
              recipients: [phone],
            }),
          });

          if (!sms.ok) throw new Error(`HTTP Gateway State Error ${sms.status}`);

          const resp = await sms.json();
          if (resp && (resp.status === 'success' || resp.code === '1000')) {
            stats.successful += 1;
          } else {
            stats.failed += 1;
          }
        } catch (err) {
          stats.failed += 1;
          console.error(`[VOTER REMINDER WORKFLOW] failed to reach ${phone}:`, err);
        } finally {
          stats.processed += 1;
          reminderQueueTracker.set(electionId, { ...stats });
        }
      })
    );
    await wait(1000); // 1s carrier pacing step delay, matches the invite queue
  }

  const finalStats = reminderQueueTracker.get(electionId);
  if (finalStats) {
    reminderQueueTracker.set(electionId, { ...finalStats, isProcessing: false });
  }
}
