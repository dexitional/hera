import Redis from 'ioredis';

// Connects directly to your local VPS Redis instance
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface GuardResult {
  isAllowed: boolean;
  message?: string;
}

export async function guardTransaction(
  phone: string, 
  lockWindowInSeconds: number = 60
): Promise<GuardResult> {
  
  const redisLockKey = `lock:charge:${phone}`;

  // Use the atomic SET with NX (Not Exists) and EX (Expiration) options
  const acquiredLock = await redis.set(
    redisLockKey, 
    'processing', 
    'EX', 
    lockWindowInSeconds, 
    'NX'
  );

  if (!acquiredLock) {
    return {
      isAllowed: false,
      message: 'A transaction is already in progress for this mobile number. Please look at your handset screen.'
    };
  }

  return { isAllowed: true };
}

/**
 * Call this if the upstream API execution encounters a hard structural failure
 * so the customer is not unfairly locked out for the remainder of the window.
 */
export async function releaseTransactionLock(phone: string): Promise<void> {
  const redisLockKey = `lock:charge:${phone}`;
  await redis.del(redisLockKey);
}
