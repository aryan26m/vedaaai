import Redis from 'ioredis';
import { env } from './env';

const redisOptions = {
  host: env.redis.host,
  port: env.redis.port,
  // Avoid long-running offline queues/retries during development
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
};

export const redis = new Redis(redisOptions as any);

redis.on('connect', () => console.log('✓ Redis connected'));
redis.on('error', (err) => console.error('✗ Redis error:', err.message));

export function createRedisConnection(): Redis {
  return new Redis(redisOptions as any);
}
