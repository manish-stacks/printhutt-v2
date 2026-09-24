import IORedis, { Redis, RedisOptions } from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

const baseOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
};

let _client: Redis | null = null;

export function redisClient(): Redis {
  if (_client) return _client;
  _client = new IORedis(baseOptions);
  _client.on('connect', () => logger.info('Redis connected'));
  _client.on('error', (err) => logger.error('Redis error', err));
  return _client;
}

// Separate connection for BullMQ (best-practice)
export function createBullConnection(): Redis {
  return new IORedis(baseOptions);
}

// ── High-level cache helpers ────────────────────────────────
export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redisClient().get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSec = 300): Promise<void> {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSec > 0) {
    await redisClient().set(key, payload, 'EX', ttlSec);
  } else {
    await redisClient().set(key, payload);
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await redisClient().del(...keys);
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const client = redisClient();
  const stream = client.scanStream({ match: pattern, count: 100 });
  const pipeline = client.pipeline();
  let count = 0;
  for await (const keys of stream) {
    for (const k of keys as string[]) {
      pipeline.del(k);
      count++;
    }
  }
  if (count > 0) await pipeline.exec();
}
