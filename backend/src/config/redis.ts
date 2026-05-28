import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => console.log('✓ Redis connected'));
redis.on('error', (err) => console.error('✗ Redis error:', err.message));

export function createRedisConnection(): Redis {
  return new Redis({
    host: env.redis.host,
    port: env.redis.port,
    maxRetriesPerRequest: null,
  });
}
