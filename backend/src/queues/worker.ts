/**
 * Worker process — run separately from API server:
 *   npm run worker
 *   npm run worker:prod
 */

import { ConnectionOptions, Queue, Worker } from 'bullmq';
import { env } from '../config/env';
import { connectDB } from '../db/connection';
import { createBullConnection } from '../redis/client';
import { QueueNames, getQueue } from './queues';

import { emailProcessor } from '../jobs/email.processor';
import {
  orderProcessor,
  pendingOrderReminderProcessor,
} from '../jobs/order.processor';
import { cacheCleanupProcessor } from '../jobs/cache-cleanup.processor';

// NEW
import {
  processOrderPendingReminders,
  processWishlistAbandoned,
} from '../modules/messaging/messaging.service';
import { logger } from '@/config/logger';

async function main(): Promise<void> {
  await connectDB();

  logger.info(`Workers starting (env=${env.NODE_ENV})`);

  /**
   * Reminder Queue
   */
  const reminderQueue = new Queue('reminders', {
    connection: createBullConnection() as unknown as ConnectionOptions,
  });

  /**
   * Schedule repeatable jobs
   */
  async function scheduleReminders() {
    // ✅ FIX: Existing repeatable jobs clear karo tabhi naye add karo
    const existingReminder = await reminderQueue.getRepeatableJobs();
    for (const job of existingReminder) {
      await reminderQueue.removeRepeatableByKey(job.key);
    }
    // Existing order queue repeatable bhi clear karo (duplicate tha)
    const existingOrder = await getQueue(QueueNames.order).getRepeatableJobs();
    for (const job of existingOrder) {
      await getQueue(QueueNames.order).removeRepeatableByKey(job.key);
    }

    // ✅ only pending reminder cron — every 15 min
    await reminderQueue.add(
      'order-pending',
      {},
      { repeat: { pattern: '*/15 * * * *' }, jobId: 'order-pending-cron' }
    );

    // Wishlist abandoned — daily at 10 AM
    await reminderQueue.add(
      'wishlist-abandoned',
      {},
      { repeat: { pattern: '0 10 * * *' }, jobId: 'wishlist-abandoned-cron' }
    );

    logger.info('Reminder cron jobs scheduled (15min/daily)');
  }

  const workers: Worker[] = [
    /**
     * Email Worker
     */
    new Worker(QueueNames.email, emailProcessor, {
      connection: createBullConnection() as unknown as ConnectionOptions,
      concurrency: 10,
    }),

    /**
     * Order Worker
     */
    new Worker(
      QueueNames.order,
      async (job) => {
        if (job.name === 'pending-reminder') {
          return pendingOrderReminderProcessor(job);
        }

        return orderProcessor(job);
      },
      {
        connection: createBullConnection() as unknown as ConnectionOptions,
        concurrency: 5,
      }
    ),

    /**
     * Cache Cleanup Worker
     */
    new Worker(QueueNames.cacheCleanup, cacheCleanupProcessor, {
      connection: createBullConnection() as unknown as ConnectionOptions,
      concurrency: 2,
    }),

    /**
     * Reminder Worker
     */
    new Worker(
      'reminders',
      async (job) => {
        switch (job.name) {
          case 'order-pending':
            return processOrderPendingReminders();

          case 'wishlist-abandoned':
            return processWishlistAbandoned();

          default:
            logger.warn(`Unknown reminder job: ${job.name}`);
            return;
        }
      },
      {
        connection: createBullConnection() as unknown as ConnectionOptions,
        concurrency: 1,
      }
    ),
  ];


  /**
   * Schedule new reminder jobs
   */
  await scheduleReminders();

  for (const w of workers) {
    w.on('completed', (job) => {
      logger.debug(`[${w.name}] completed ${job.id}`);
    });
    w.on('failed', (job, err) => {
      logger.error(`[${w.name}] failed ${job?.id}`, err);
    });
  }
  
  const shutdown = async (signal: string) => {
    logger.info(`Worker received ${signal}, closing...`);

    await Promise.all(workers.map((w) => w.close()));

    await reminderQueue.close();

    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Worker crashed', err);
  process.exit(1);
});