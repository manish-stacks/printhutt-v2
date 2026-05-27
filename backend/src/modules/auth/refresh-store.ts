/**
 * Refresh-token store backed by Redis.
 *
 * Key layout:
 *   refresh:{userId}:{tokenId} = "1"   TTL = refresh-token lifetime
 *
 * Operations:
 *   - issueRefresh(userId, tokenId)        — record on login / rotation
 *   - refreshExists(userId, tokenId)        — verify on refresh
 *   - revokeRefresh(userId, tokenId)        — single-device logout / rotation
 *   - revokeAllRefresh(userId)              — logout from all devices
 */
import { redisClient } from '@/redis/client';

const keyOf = (userId: string, tokenId: string): string =>
  `refresh:${userId}:${tokenId}`;
const patternOf = (userId: string): string => `refresh:${userId}:*`;

// Default TTL — keep in sync with REFRESH_TOKEN_EXPIRES_IN env (30d)
const DEFAULT_TTL_SEC = 30 * 24 * 60 * 60;

export async function issueRefresh(
  userId: string,
  tokenId: string,
  ttlSec = DEFAULT_TTL_SEC
): Promise<void> {
  await redisClient().set(keyOf(userId, tokenId), '1', 'EX', ttlSec);
}

export async function refreshExists(userId: string, tokenId: string): Promise<boolean> {
  return (await redisClient().get(keyOf(userId, tokenId))) !== null;
}

export async function revokeRefresh(userId: string, tokenId: string): Promise<void> {
  await redisClient().del(keyOf(userId, tokenId));
}

export async function revokeAllRefresh(userId: string): Promise<void> {
  const client = redisClient();
  const stream = client.scanStream({ match: patternOf(userId), count: 100 });
  const pipeline = client.pipeline();
  let count = 0;
  for await (const keys of stream) {
    for (const k of keys as string[]) {
      pipeline.del(k);
      count += 1;
    }
  }
  if (count > 0) await pipeline.exec();
}
