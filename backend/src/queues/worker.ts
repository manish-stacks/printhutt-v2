/**
 * Worker process — run separately from API server:
 *   pnpm worker         # dev (tsx watch)
 *   pnpm worker:prod    # production
 *
 * One process can host all workers, or split per-queue for scaling.
 */
import { Worker } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { connectDB } from '../db/connection';
import { createBullConnection } from '../redis/client';
import { QueueNames, getQueue } from './queues';
import { emailProcessor } from '../jobs/email.processor';
import {
  orderProcessor,
  pendingOrderReminderProcessor,
} from '../jobs/order.processor';
import { cacheCleanupProcessor } from '../jobs/cache-cleanup.processor';

async function main(): Promise<void> {
  await connectDB();
  logger.info(`Workers starting (env=${env.NODE_ENV})`);

  const workers: Worker[] = [
    new Worker(QueueNames.email, emailProcessor, {
      connection: createBullConnection(),
      concurrency: 10,
    }),
    new Worker(
      QueueNames.order,
      async (job) => {
        if (job.name === 'pending-reminder') {
          return pendingOrderReminderProcessor(job);
        }
        return orderProcessor(job);
      },
      { connection: createBullConnection(), concurrency: 5 }
    ),
    new Worker(QueueNames.cacheCleanup, cacheCleanupProcessor, {
      connection: createBullConnection(),
      concurrency: 2,
    }),
  ];

  // Repeatable schedule — pending order reminder every hour
  await getQueue(QueueNames.order).add(
    'pending-reminder',
    {},
    { repeat: { pattern: '0 * * * *' }, jobId: 'pending-reminder-cron' }
  );

  for (const w of workers) {
    w.on('completed', (job) => logger.debug(`[${w.name}] completed ${job.id}`));
    w.on('failed', (job, err) => logger.error(`[${w.name}] failed ${job?.id}`, err));
  }

  const shutdown = async (sig: string): Promise<void> => {
    logger.info(`Worker received ${sig}, closing...`);
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Worker crashed', err);
  process.exit(1);
});
