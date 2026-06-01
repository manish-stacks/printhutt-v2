import { ConnectionOptions, Queue, QueueEvents } from 'bullmq';
import { createBullConnection } from '../redis/client';

export const QueueNames = {
  email: 'email',
  order: 'order',
  shipping: 'shipping',
  notifications: 'notifications',
  cacheCleanup: 'cache-cleanup',
  inventory: 'inventory',
  analytics: 'analytics',
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, {
      connection: createBullConnection() as unknown as ConnectionOptions,
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

export function getQueueEvents(name: QueueName): QueueEvents {
  return new QueueEvents(name, { connection: createBullConnection() as unknown as ConnectionOptions });
}

// Convenience producers
export interface EmailJobData {
  type: 'verify' | 'reset' | 'order-confirm' | 'order-status' | 'otp-email' | 'otp-sms';
  payload: Record<string, unknown>;
}

export async function enqueueEmail(data: EmailJobData): Promise<void> {
  await getQueue(QueueNames.email).add(data.type, data);
}

export async function enqueueOrderProcess(orderId: string): Promise<void> {
  await getQueue(QueueNames.order).add('process', { orderId });
}

export async function enqueueCacheCleanup(pattern: string): Promise<void> {
  await getQueue(QueueNames.cacheCleanup).add('clean', { pattern });
}
