/**
 * Worker process — run separately from API server:
 *   npm run worker
 *   npm run worker:prod
 */

import { ConnectionOptions, Queue, Worker } from 'bullmq';
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

// NEW
import {
  processOrderPendingReminders,
  processWishlistAbandoned,
} from '../modules/messaging/messaging.service';

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
    const existing = await reminderQueue.getRepeatableJobs();

    for (const job of existing) {
      await reminderQueue.removeRepeatableByKey(job.key);
    }

    // Every hour
    await reminderQueue.add(
      'order-pending',
      {},
      {
        repeat: {
          pattern: '0 * * * *',
        },
      }
    );

    // Daily at 10 AM
    await reminderQueue.add(
      'wishlist-abandoned',
      {},
      {
        repeat: {
          pattern: '0 10 * * *',
        },
      }
    );

    logger.info('Reminder cron jobs scheduled');
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
        }
      },
      {
        connection: createBullConnection() as unknown as ConnectionOptions,
        concurrency: 1,
      }
    ),
  ];

  /**
   * Existing Pending Reminder Cron
   */
  await getQueue(QueueNames.order).add(
    'pending-reminder',
    {},
    {
      repeat: {
        pattern: '0 * * * *',
      },
      jobId: 'pending-reminder-cron',
    }
  );

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