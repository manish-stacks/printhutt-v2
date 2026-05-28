"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueNames = void 0;
exports.getQueue = getQueue;
exports.getQueueEvents = getQueueEvents;
exports.enqueueEmail = enqueueEmail;
exports.enqueueOrderProcess = enqueueOrderProcess;
exports.enqueueCacheCleanup = enqueueCacheCleanup;
const bullmq_1 = require("bullmq");
const client_1 = require("../redis/client");
exports.QueueNames = {
    email: 'email',
    order: 'order',
    shipping: 'shipping',
    notifications: 'notifications',
    cacheCleanup: 'cache-cleanup',
    inventory: 'inventory',
    analytics: 'analytics',
};
const queues = new Map();
function getQueue(name) {
    let q = queues.get(name);
    if (!q) {
        q = new bullmq_1.Queue(name, {
            connection: (0, client_1.createBullConnection)(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: { age: 24 * 3600, count: 1000 },
                removeOnFail: { age: 7 * 24 * 3600 },
            },
        });
        queues.set(name, q);
    }
    return q;
}
function getQueueEvents(name) {
    return new bullmq_1.QueueEvents(name, { connection: (0, client_1.createBullConnection)() });
}
async function enqueueEmail(data) {
    await getQueue(exports.QueueNames.email).add(data.type, data);
}
async function enqueueOrderProcess(orderId) {
    await getQueue(exports.QueueNames.order).add('process', { orderId });
}
async function enqueueCacheCleanup(pattern) {
    await getQueue(exports.QueueNames.cacheCleanup).add('clean', { pattern });
}
//# sourceMappingURL=queues.js.map