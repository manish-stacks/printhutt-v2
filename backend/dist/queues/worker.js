"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Worker process — run separately from API server:
 *   pnpm worker         # dev (tsx watch)
 *   pnpm worker:prod    # production
 *
 * One process can host all workers, or split per-queue for scaling.
 */
const bullmq_1 = require("bullmq");
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const connection_1 = require("../db/connection");
const client_1 = require("../redis/client");
const queues_1 = require("./queues");
const email_processor_1 = require("../jobs/email.processor");
const order_processor_1 = require("../jobs/order.processor");
const cache_cleanup_processor_1 = require("../jobs/cache-cleanup.processor");
async function main() {
    await (0, connection_1.connectDB)();
    logger_1.logger.info(`Workers starting (env=${env_1.env.NODE_ENV})`);
    const workers = [
        new bullmq_1.Worker(queues_1.QueueNames.email, email_processor_1.emailProcessor, {
            connection: (0, client_1.createBullConnection)(),
            concurrency: 10,
        }),
        new bullmq_1.Worker(queues_1.QueueNames.order, async (job) => {
            if (job.name === 'pending-reminder') {
                return (0, order_processor_1.pendingOrderReminderProcessor)(job);
            }
            return (0, order_processor_1.orderProcessor)(job);
        }, { connection: (0, client_1.createBullConnection)(), concurrency: 5 }),
        new bullmq_1.Worker(queues_1.QueueNames.cacheCleanup, cache_cleanup_processor_1.cacheCleanupProcessor, {
            connection: (0, client_1.createBullConnection)(),
            concurrency: 2,
        }),
    ];
    // Repeatable schedule — pending order reminder every hour
    await (0, queues_1.getQueue)(queues_1.QueueNames.order).add('pending-reminder', {}, { repeat: { pattern: '0 * * * *' }, jobId: 'pending-reminder-cron' });
    for (const w of workers) {
        w.on('completed', (job) => logger_1.logger.debug(`[${w.name}] completed ${job.id}`));
        w.on('failed', (job, err) => logger_1.logger.error(`[${w.name}] failed ${job?.id}`, err));
    }
    const shutdown = async (sig) => {
        logger_1.logger.info(`Worker received ${sig}, closing...`);
        await Promise.all(workers.map((w) => w.close()));
        process.exit(0);
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
}
main().catch((err) => {
    logger_1.logger.error('Worker crashed', err);
    process.exit(1);
});
//# sourceMappingURL=worker.js.map