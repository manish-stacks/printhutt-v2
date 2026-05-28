"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueRefresh = issueRefresh;
exports.refreshExists = refreshExists;
exports.revokeRefresh = revokeRefresh;
exports.revokeAllRefresh = revokeAllRefresh;
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
const client_1 = require("@/redis/client");
const keyOf = (userId, tokenId) => `refresh:${userId}:${tokenId}`;
const patternOf = (userId) => `refresh:${userId}:*`;
// Default TTL — keep in sync with REFRESH_TOKEN_EXPIRES_IN env (30d)
const DEFAULT_TTL_SEC = 30 * 24 * 60 * 60;
async function issueRefresh(userId, tokenId, ttlSec = DEFAULT_TTL_SEC) {
    await (0, client_1.redisClient)().set(keyOf(userId, tokenId), '1', 'EX', ttlSec);
}
async function refreshExists(userId, tokenId) {
    return (await (0, client_1.redisClient)().get(keyOf(userId, tokenId))) !== null;
}
async function revokeRefresh(userId, tokenId) {
    await (0, client_1.redisClient)().del(keyOf(userId, tokenId));
}
async function revokeAllRefresh(userId) {
    const client = (0, client_1.redisClient)();
    const stream = client.scanStream({ match: patternOf(userId), count: 100 });
    const pipeline = client.pipeline();
    let count = 0;
    for await (const keys of stream) {
        for (const k of keys) {
            pipeline.del(k);
            count += 1;
        }
    }
    if (count > 0)
        await pipeline.exec();
}
//# sourceMappingURL=refresh-store.js.map