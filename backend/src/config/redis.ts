import Redis from 'ioredis';
import { logger } from './logger';

let redisClient: Redis | null = null;
let redisReady = false;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      redisReady = true;
      logger.info('✅ Redis connected');
    });
    redisClient.on('error', (err) => logger.warn('Redis error (non-fatal)', { err: err.message }));
    redisClient.on('close', () => { redisReady = false; });
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  try {
    const client = getRedisClient();
    await client.connect();
  } catch {
    logger.warn('Redis unavailable, running without cache');
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redisReady) return null;
  try {
    const data = await getRedisClient().get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  if (!redisReady) return;
  try {
    await getRedisClient().setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // silently fail
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redisReady) return;
  try {
    await getRedisClient().del(key);
  } catch {
    // silently fail
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!redisReady) return;
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      const pipeline = client.pipeline();
      keys.forEach((k) => pipeline.del(k));
      await pipeline.exec();
    }
  } catch {
    // silently fail
  }
}
