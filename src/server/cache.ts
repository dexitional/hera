import { fastRedis } from './redis-fast';

// Short-lived shared cache for expensive, frequently polled reads (live
// election dashboards poll every 15-30s per open tab, often with several
// admins / projector screens watching the same election). Shared across PM2
// processes via Redis.
//
// Only cache values that survive a JSON round trip (no Date objects, Maps,
// etc.), and only AFTER the caller's access check -- the cache key carries no
// identity, so it must never be consulted before authorization.
//
// Best effort: any Redis failure falls through to computing the value.

export async function withCache<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  const cacheKey = `cache:${key}`;
  try {
    const hit = await fastRedis.get(cacheKey);
    if (hit !== null) return JSON.parse(hit) as T;
  } catch {
    // Redis unavailable -- compute directly.
  }

  const value = await compute();

  try {
    await fastRedis.set(cacheKey, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // ignore
  }
  return value;
}
