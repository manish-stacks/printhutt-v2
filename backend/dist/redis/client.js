"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = redisClient;
exports.createBullConnection = createBullConnection;
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDel = cacheDel;
exports.cacheDelPattern = cacheDelPattern;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const baseOptions = {
    host: env_1.env.REDIS_HOST,
    port: env_1.env.REDIS_PORT,
    password: env_1.env.REDIS_PASSWORD || undefined,
    db: env_1.env.REDIS_DB,
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
};
let _client = null;
function redisClient() {
    if (_client)
        return _client;
    _client = new ioredis_1.default(baseOptions);
    _client.on('connect', () => logger_1.logger.info('Redis connected'));
    _client.on('error', (err) => logger_1.logger.error('Redis error', err));
    return _client;
}
// Separate connection for BullMQ (best-practice)
function createBullConnection() {
    return new ioredis_1.default(baseOptions);
}
// ── High-level cache helpers ────────────────────────────────
async function cacheGet(key) {
    const raw = await redisClient().get(key);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return raw;
    }
}
async function cacheSet(key, value, ttlSec = 300) {
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSec > 0) {
        await redisClient().set(key, payload, 'EX', ttlSec);
    }
    else {
        await redisClient().set(key, payload);
    }
}
async function cacheDel(...keys) {
    if (keys.length === 0)
        return;
    await redisClient().del(...keys);
}
async function cacheDelPattern(pattern) {
    const client = redisClient();
    const stream = client.scanStream({ match: pattern, count: 100 });
    const pipeline = client.pipeline();
    let count = 0;
    for await (const keys of stream) {
        for (const k of keys) {
            pipeline.del(k);
            count++;
        }
    }
    if (count > 0)
        await pipeline.exec();
}
//# sourceMappingURL=client.js.map