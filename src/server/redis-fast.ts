import Redis from 'ioredis';

// Shared "fail fast" Redis client for best-effort features: the voter login
// lockout (voter-auth.ts), the tally cache (cache.ts) and broadcast progress
// counters (jobs/sms-broadcast.ts).
//
// enableOfflineQueue: false -> commands reject immediately while disconnected
// instead of queueing and hanging the request. Every caller treats a Redis
// error as "feature unavailable" and carries on, so a Redis outage degrades
// these features instead of taking voting down.
//
// BullMQ uses its own connections (it requires maxRetriesPerRequest: null).

export const fastRedis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

let lastErrorLog = 0;
fastRedis.on('error', (err) => {
  const now = Date.now();
  if (now - lastErrorLog > 60_000) {
    lastErrorLog = now;
    console.error('[REDIS] unavailable (lockout, tally cache and broadcast progress degraded):', err?.message);
  }
});

/**
 * Waits (briefly) for the fail-fast client to be connected. Without this, a
 * command issued right after process start -- or during a reconnect --
 * rejects immediately. Use where a dropped command matters (broadcast start
 * and progress counters); best-effort callers can skip it.
 */
export async function fastRedisReady(timeoutMs = 3000): Promise<void> {
  if (fastRedis.status === 'ready') return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      fastRedis.off('ready', onReady);
      reject(new Error(`Redis not ready after ${timeoutMs}ms (status: ${fastRedis.status})`));
    }, timeoutMs);
    const onReady = () => {
      clearTimeout(timer);
      resolve();
    };
    fastRedis.once('ready', onReady);
  });
}
