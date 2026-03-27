import Redis from 'ioredis';

let redis: Redis | null = null;

try {
  // Try connecting to Redis if REDIS_URL exists, or default to localhost
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  redis = new Redis(redisUrl, {
    retryStrategy: (times) => {
      // Don't retry more than 3 times
      if (typeof times === 'number' && times > 3) {
        return null; // Stop retrying
      }
      return Math.min(times * 50, 2000); // Wait between 50ms and 2s
    },
    maxRetriesPerRequest: 1
  });

  redis.on('error', (err) => {
    console.warn('⚠️ Redis Connection Error (Rate limiting might be bypassed):', err.message);
  });
} catch (e) {
  console.warn('⚠️ Could not initialize Redis:', e);
}

export default redis;
