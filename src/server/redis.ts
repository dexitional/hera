import Redis from 'ioredis';

// Connects directly to the native Redis instance running on your VPS
export const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379/0');

// Shared utility helper for cache key generation naming standards
export const getCacheKeys = {
  electionResults: (electionId: string) => `cache:results:election:${electionId}`,
};
