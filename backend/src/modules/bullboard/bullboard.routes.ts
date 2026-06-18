/**
 * Bull Board — BullMQ Queue Dashboard
 *
 * Install before using:
 *   npm install @bull-board/express @bull-board/api
 *
 * Access: http://yourdomain:4000/api/admin/queues
 */

import { Router } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueue, QueueNames } from '@/queues/queues';
import { Queue, ConnectionOptions } from 'bullmq';
import { createBullConnection } from '@/redis/client';

const router = Router();

// Reminders queue — worker mein alag se banta hai, yahan bhi connect karo
const reminderQueue = new Queue('reminders', {
  connection: createBullConnection() as unknown as ConnectionOptions,
});

const serverAdapter = new ExpressAdapter();
// ✅ basePath = jahan mount karoge app.ts mein
serverAdapter.setBasePath('/api/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(getQueue(QueueNames.email)),
    new BullMQAdapter(getQueue(QueueNames.order)),
    new BullMQAdapter(getQueue(QueueNames.cacheCleanup)),
    new BullMQAdapter(reminderQueue),
  ],
  serverAdapter,
});

router.use('/', serverAdapter.getRouter());

export default router;