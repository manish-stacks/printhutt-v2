import { Job } from 'bullmq';
import { logger } from '../config/logger';
import Order from '../db/models/orderModel';

/**
 * Order processing job. Ported behaviour from the original
 * src/lib/orderReminderCron.ts + src/app/api/cron/pending-order-reminder.
 * Sends reminder emails for orders left in `pending` for > X hours.
 */
export async function orderProcessor(job: Job<{ orderId: string }>): Promise<void> {
  const { orderId } = job.data;
  logger.info(`[queue:order] processing ${orderId}`, { id: job.id });

  const order = await Order.findById(orderId);
  if (!order) {
    logger.warn(`[queue:order] order ${orderId} not found`);
    return;
  }
  // TODO: wire into existing email helpers in @/utils/mail/mailer
  // (kept as a one-line stub — original cron logic should be moved here).
}

/**
 * Periodic pending-order reminder. Scheduled via repeatable job (every 1h).
 */
export async function pendingOrderReminderProcessor(_job: Job): Promise<void> {
  // Move the body of src/app/api/cron/pending-order-reminder/route.ts here.
  // Query pending orders older than N hours, send reminder, mark reminderSent: true.
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6h
  const stuck = await Order.find({
    status: 'pending',
    createdAt: { $lt: cutoff },
    reminderSent: { $ne: true },
  })
    .limit(50)
    .lean();
  logger.info(`[queue:order] pending reminders: ${stuck.length}`);
  // TODO: send mails, then Order.updateMany({_id: {$in: stuck.map(o=>o._id)}}, {reminderSent: true})
}
