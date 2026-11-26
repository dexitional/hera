import { randomUUID } from 'node:crypto';
import { Queue, Worker, type ConnectionOptions, type Job } from 'bullmq';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { elections, voters } from '../../db/schema';
import { addCountryCode, buildElectionVoteUrl } from '../../lib/utils';
import { sendSmsMessage } from '../sms-gateway';
import { fastRedis, fastRedisReady } from '../redis-fast';
import { revealToken } from '../voter-token';

// Bulk SMS broadcasts (voter invites + "don't forget to vote" reminders) on a
// BullMQ queue in Redis.
//
// Replaces two in-process loops whose progress and "already running" guard
// lived in each Node process's memory. Under PM2 cluster mode that meant the
// admin progress bar polled whichever process answered (wrong numbers), two
// processes could run the same broadcast at once (double SMS cost), and a
// restart/deploy mid-broadcast silently dropped the remaining sends.
//
// Now:
//   * one job per voter, durable in Redis; resumes after a restart
//   * job data holds IDs only -- the worker loads the voter and decrypts the
//     token at send time, so no codes/phone numbers sit in Redis
//   * global pacing of ~25 SMS/second across all processes (BullMQ limiter),
//     matching the old 25-per-batch + 1s delay
//   * progress + a per-election/kind lock in Redis, shared by every process
//   * gateway errors are NOT retried by the queue (fetchWithRetry already
//     retries network errors/429/5xx; retrying an ambiguous gateway response
//     could send the voter a duplicate). Only failures before anything is
//     sent (e.g. a DB error) are retried.
//   * delivery is at-least-once: if a process dies mid-send, BullMQ re-runs
//     that one in-flight job, so a voter may rarely get the same SMS twice.

export type BroadcastKind = 'invite' | 'reminder';
type SmsJobData = { kind: BroadcastKind; electionId: string; voterId: string; broadcastId: string };
export type BroadcastProgress = { isProcessing: boolean; total: number; processed: number; successful: number; failed: number };

const QUEUE_NAME = 'heravote-sms';
const SMS_PER_SECOND = 25;
// Limiter windows are fixed, so a 25-per-1000ms limit can burst ~50 across a
// window boundary. 5 per 200ms keeps the same average with a peak of ~30 in
// any one-second span.
const LIMITER = { max: 5, duration: 200 };
// A broadcast with no progress for this long is treated as dead, so a stuck
// lock can never block an admin indefinitely.
const STALE_AFTER_MS = 15 * 60 * 1000;
const PROGRESS_TTL_SECONDS = 7 * 24 * 60 * 60;

const progressKey = (kind: BroadcastKind, electionId: string) => `broadcast:${kind}:${electionId}`;
const lockKey = (kind: BroadcastKind, electionId: string) => `broadcast-lock:${kind}:${electionId}`;
// Voters already counted in a broadcast -- makes progress counting idempotent
// when BullMQ re-runs a job whose worker died after counting it.
const countedKey = (broadcastId: string) => `broadcast-counted:${broadcastId}`;

function connection(): ConnectionOptions {
  const url = new URL(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    username: url.username || undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: Number(url.pathname.slice(1)) || 0,
    ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
    maxRetriesPerRequest: null, // required by BullMQ workers
  };
}

let queue: Queue<SmsJobData> | null = null;
function getQueue(): Queue<SmsJobData> {
  queue ??= new Queue<SmsJobData>(QUEUE_NAME, { connection: connection() });
  return queue;
}

// ------------------------------------------------------------------
// Messages (text unchanged from the previous in-process loops)
// ------------------------------------------------------------------

function hoursRemainingLabel(endAt: Date): string {
  const hours = Math.round((new Date(endAt).getTime() - Date.now()) / (1000 * 60 * 60));
  return hours > 0 ? `${hours} hour${hours === 1 ? '' : 's'}` : 'soon';
}

function buildMessage(kind: BroadcastKind, voter: typeof voters.$inferSelect, election: typeof elections.$inferSelect): string {
  const electionUrl = buildElectionVoteUrl({ tag: election.tag, aliasUrl: election.aliasUrl });
  if (kind === 'reminder') {
    const firstName = voter.name?.split(' ')[0] || 'there';
    const endAt = election.endAt ?? new Date();
    return `Hi ${firstName}, this is a reminder to vote in ${election.title}. Voting closes in ${hoursRemainingLabel(endAt)}. Cast your ballot: ${electionUrl}`;
  }
  const fname = voter.name?.split(' ')[0];
  const inviteToken = revealToken(voter);
  // OTP-mode elections don't have a username/password pair to hand out, just the code.
  if (['otp', 'aotp'].includes((election.authMode || '').toLowerCase())) {
    return `Hello ${fname}, Your Verification OTP is ${inviteToken}. Visit ${electionUrl} to vote!`;
  }
  const usernameLabel = election.placeholder?.username || 'Username';
  const passwordLabel = election.placeholder?.password || 'Password';
  return `Hello ${fname}, Please vote with ${usernameLabel}: ${voter.username}, ${passwordLabel}: ${inviteToken}. Visit ${electionUrl} to vote!`;
}

// ------------------------------------------------------------------
// Progress
// ------------------------------------------------------------------

async function recordOutcome(data: SmsJobData, outcome: 'successful' | 'failed'): Promise<void> {
  try {
    // A lost increment would leave the broadcast looking stuck, so wait out
    // a (re)connect rather than failing fast.
    await fastRedisReady(10_000);
    const key = progressKey(data.kind, data.electionId);
    // Ignore leftovers from an older broadcast of the same kind.
    if ((await fastRedis.hget(key, 'id')) !== data.broadcastId) return;
    const counted = countedKey(data.broadcastId);
    if ((await fastRedis.sadd(counted, data.voterId)) === 0) return; // already counted
    await fastRedis.expire(counted, PROGRESS_TTL_SECONDS);
    const [processed, total] = await Promise.all([
      fastRedis.hincrby(key, 'processed', 1),
      fastRedis.hget(key, 'total'),
      fastRedis.hincrby(key, outcome, 1),
      fastRedis.hset(key, 'updatedAt', Date.now()),
    ]).then((r) => [Number(r[0]), Number(r[1])]);
    if (processed >= total) await fastRedis.del(lockKey(data.kind, data.electionId));
  } catch (err: any) {
    console.error('[SMS BROADCAST] progress update failed:', err?.message);
  }
}

export async function getBroadcastProgress(kind: BroadcastKind, electionId: string): Promise<BroadcastProgress> {
  const empty = { isProcessing: false, total: 0, processed: 0, successful: 0, failed: 0 };
  try {
    await fastRedisReady();
    const h = await fastRedis.hgetall(progressKey(kind, electionId));
    if (!h?.id) return empty;
    const total = Number(h.total) || 0;
    const processed = Number(h.processed) || 0;
    const fresh = Date.now() - Number(h.updatedAt || 0) < STALE_AFTER_MS;
    return {
      isProcessing: processed < total && fresh,
      total,
      processed,
      successful: Number(h.successful) || 0,
      failed: Number(h.failed) || 0,
    };
  } catch {
    return empty;
  }
}

// ------------------------------------------------------------------
// Start
// ------------------------------------------------------------------

export type StartBroadcastResult =
  | { started: true; total: number }
  | { started: false; reason: 'already_running' | 'empty' };

/**
 * Queues one SMS per voter. At most one broadcast of each kind per election
 * runs at a time, across all processes. Throws if Redis is unavailable.
 */
export async function startBroadcast(kind: BroadcastKind, electionId: string, voterIds: string[]): Promise<StartBroadcastResult> {
  if (voterIds.length === 0) return { started: false, reason: 'empty' };
  await fastRedisReady();

  const broadcastId = randomUUID();
  const lock = lockKey(kind, electionId);
  const acquired = await fastRedis.set(lock, broadcastId, 'EX', PROGRESS_TTL_SECONDS, 'NX');
  if (!acquired) {
    const progress = await getBroadcastProgress(kind, electionId);
    if (progress.isProcessing) return { started: false, reason: 'already_running' };
    // Previous broadcast finished without releasing, or went stale: take over.
    await fastRedis.set(lock, broadcastId, 'EX', PROGRESS_TTL_SECONDS);
  }

  const key = progressKey(kind, electionId);
  await fastRedis
    .multi()
    .del(key)
    .hset(key, { id: broadcastId, total: voterIds.length, processed: 0, successful: 0, failed: 0, startedAt: Date.now(), updatedAt: Date.now() })
    .expire(key, PROGRESS_TTL_SECONDS)
    .exec();

  try {
    const q = getQueue();
    for (let i = 0; i < voterIds.length; i += 1000) {
      await q.addBulk(
        voterIds.slice(i, i + 1000).map((voterId) => ({
          name: kind,
          data: { kind, electionId, voterId, broadcastId },
          opts: {
            // Dedupes a voter within a broadcast. (BullMQ forbids ':' in custom ids.)
            jobId: `${broadcastId}_${voterId}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: { age: 24 * 60 * 60 },
          },
        })),
      );
    }
  } catch (err) {
    await fastRedis.del(lock, key).catch(() => {});
    throw err;
  }

  ensureSmsWorker();
  return { started: true, total: voterIds.length };
}

// ------------------------------------------------------------------
// Worker
// ------------------------------------------------------------------

async function processSmsJob(job: Job<SmsJobData>): Promise<void> {
  const data = job.data;

  // Anything that throws BEFORE the SMS is sent is retried by BullMQ.
  const [row] = await db
    .select()
    .from(voters)
    .innerJoin(elections, eq(voters.electionId, elections.id))
    .where(and(eq(voters.id, data.voterId), eq(voters.electionId, data.electionId)));

  if (!row) return recordOutcome(data, 'failed'); // voter deleted since queueing

  const phone = addCountryCode(row.voters.phoneNumber);
  if (!phone?.length || phone.length < 9) return recordOutcome(data, 'failed');

  const message = buildMessage(data.kind, row.voters, row.elections);

  // From here on, never throw: a retry could send a duplicate.
  let outcome: 'successful' | 'failed' = 'failed';
  try {
    // Active gateway (Arkesel / mNotify / SMSOnlineGH), with fallback if enabled.
    const sent = await sendSmsMessage(phone, message);
    if (sent.ok) outcome = 'successful';
    else throw new Error(sent.error ?? 'gateway error');
  } catch (err: any) {
    console.error(`[SMS BROADCAST] ${data.kind} to ${phone} failed:`, err?.message);
  }

  if (outcome === 'successful' && data.kind === 'invite') {
    await db.update(voters).set({ isVerified: true }).where(eq(voters.id, data.voterId)).catch((err) => {
      console.error('[SMS BROADCAST] could not mark voter verified:', err?.message);
    });
  }
  await recordOutcome(data, outcome);
}

// Kept on globalThis, not in a module variable: Nitro bundles the startup
// plugin and the server-function chunks separately, so this module can be
// instantiated more than once per process -- a module-level singleton would
// start one worker per copy.
const WORKER_KEY = Symbol.for('heravote.smsBroadcastWorker');
const registry = globalThis as unknown as { [WORKER_KEY]?: Worker<SmsJobData> | null };

/**
 * Starts this process's queue worker (idempotent). Called from the Nitro
 * startup plugin (src/server/plugins/jobs.ts) so queued jobs resume as soon
 * as any server process boots, and again on enqueue as a safety net.
 * Every PM2 process runs one; the limiter is global across them.
 */
export function ensureSmsWorker(): void {
  if (registry[WORKER_KEY] || process.env.HERAVOTE_DISABLE_WORKERS === '1') return;
  const worker = new Worker<SmsJobData>(QUEUE_NAME, processSmsJob, {
    connection: connection(),
    concurrency: SMS_PER_SECOND,
    limiter: LIMITER,
  });
  registry[WORKER_KEY] = worker;
  worker.on('error', (err) => console.error('[SMS BROADCAST] worker error:', err?.message));
  worker.on('failed', (job, err) => {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      console.error(`[SMS BROADCAST] job ${job.id} failed permanently:`, err?.message);
      void recordOutcome(job.data, 'failed');
    }
  });
}

/** Lets in-flight jobs finish on shutdown (wired to Nitro's 'close' hook). */
export async function closeSmsWorker(): Promise<void> {
  const w = registry[WORKER_KEY];
  registry[WORKER_KEY] = null;
  await Promise.allSettled([w?.close(), queue?.close()]);
  queue = null;
}
