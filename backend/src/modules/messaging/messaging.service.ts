import MessageLog from '@/db/models/messageLog.model';
import User from '@/db/models/userModel';
import { Types } from 'mongoose';
import { enqueueEmail } from '@/queues/queues';
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { logger } from '@/config/logger';

/* ─── HARDCODED MESSAGES — yahan edit karo ─── */
export const MESSAGES = {
  order_confirm: {
    channel: 'email' as const,
    subject: 'Order Confirmed - #{{orderId}}',
    body: `Hi {{userName}},

Your order #{{orderId}} has been confirmed! 🎉

Amount: ₹{{totalAmount}}
Track at: https://printhutt.com/order-track/{{orderId}}

Thanks for shopping with us!
- PrintHutt Team`,
  },
  order_failed: {
    channel: 'email' as const,
    subject: 'Payment Failed - #{{orderId}}',
    body: `Hi {{userName}},

Your payment for order #{{orderId}} could not be completed.

Please try again: https://printhutt.com/order/{{orderId}}

Need help? Reply to this email.
- PrintHutt Team`,
  },
  order_pending_reminder: {
    channel: 'email' as const,
    subject: 'Complete Your Order - #{{orderId}}',
    body: `Hi {{userName}},

Your order #{{orderId}} is still pending payment.

Amount: ₹{{totalAmount}}
Complete payment: https://printhutt.com/order/{{orderId}}

Don't miss out!
- PrintHutt Team`,
  },
  wishlist_abandoned: {
    channel: 'email' as const,
    subject: 'Items waiting in your wishlist 💝',
    body: `Hi {{userName}},

You have {{itemCount}} items waiting in your wishlist.

View now: https://printhutt.com/wishlist

- PrintHutt Team`,
  },
};

/* ─── Placeholder renderer ─── */
function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

/* ─── 1. MANUAL SEND (admin se) — placeholder render hota hai ─── */
export async function sendManualMessage(opts: {
  userId: string;
  channel: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  body: string;
}): Promise<unknown> {
  const user = await User.findById(opts.userId);
  if (!user) throw new NotFoundError('User not found');

  if (opts.channel === 'email' && !user.email) {
    throw new BadRequestError('User has no email');
  }
  if ((opts.channel === 'sms' || opts.channel === 'whatsapp') && !user.number) {
    throw new BadRequestError('User has no mobile number');
  }

  // 🔑 RENDER PLACEHOLDERS — yahaan {{userName}} replace hota hai
  const vars: Record<string, string> = {
    userName: user.username || 'Customer',
    userEmail: user.email || '',
    userNumber: String(user.number || ''),
  };

  const renderedSubject = opts.subject ? renderTemplate(opts.subject, vars) : 'Message from PrintHutt';
  const renderedBody = renderTemplate(opts.body, vars);

  const log = await MessageLog.create({
    userId: user._id,
    channel: opts.channel,
    triggerType: 'manual',
    subject: renderedSubject,
    body: renderedBody,
    status: 'pending',
  });

  try {
    await enqueueEmail({
      type: opts.channel === 'email' ? 'custom-email' : 'custom-sms',
      payload: {
        email: user.email,
        mobile: user.number,
        subject: renderedSubject,
        body: renderedBody,
        logId: String(log._id),
      },
    });

    log.status = 'sent';
    log.sentAt = new Date();
    await log.save();
  } catch (e) {
    log.status = 'failed';
    log.error = (e as Error).message;
    await log.save();
    throw e;
  }

  return { success: true, message: 'Message queued', logId: log._id };
}

/* ─── 2. ORDER EVENT — call this from order/payment service ─── */
export async function sendOrderEventMessage(
  order: any,
  event: 'order_confirm' | 'order_failed' | 'order_pending_reminder'
): Promise<void> {
  try {
    const userId = order.user || order.userId;
    if (!userId) return;

    const user = await User.findById(userId);
    if (!user?.email) return;

    // 🔒 DEDUP — ek order ka ek hi message
    const exists = await MessageLog.findOne({
      userId: user._id,
      triggerType: event,
      'meta.orderId': order.orderId,
    });
    if (exists) return;

    const config = MESSAGES[event];
    const vars = {
      userName: user.username || 'Customer',
      orderId: String(order.orderId || ''),
      totalAmount: String(order.totalAmount?.discountPrice || 0),
    };

    const subject = renderTemplate(config.subject, vars);
    const body = renderTemplate(config.body, vars);

    const log = await MessageLog.create({
      userId: user._id,
      channel: config.channel,
      triggerType: event,
      subject,
      body,
      status: 'pending',
      meta: { orderId: order.orderId },
    });

    try {
      await enqueueEmail({
        type: 'custom-email',
        payload: {
          email: user.email,
          subject,
          body,
          logId: String(log._id),
        },
      });
      log.status = 'sent';
      log.sentAt = new Date();
      await log.save();
      logger.info(`[messaging] ${event} sent to ${user.email} for order ${order.orderId}`);
    } catch (e) {
      log.status = 'failed';
      log.error = (e as Error).message;
      await log.save();
    }
  } catch (e) {
    logger.error('[messaging] sendOrderEventMessage failed', e);
  }
}

/* ─── 3. CRON: Order pending reminder (every 15 min) ─── */
export async function processOrderPendingReminders(): Promise<{ sent: number }> {
  const Order = (await import('@/db/models/orderModel')).default;

  // Orders pending for >= 15 min, status pending
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);

  const orders = await Order.find({
    status: 'pending',
    createdAt: { $lte: cutoff },
  });

  let sent = 0;
  for (const order of orders as any[]) {
    const before = await MessageLog.exists({
      triggerType: 'order_pending_reminder',
      'meta.orderId': order.orderId,
    });
    if (before) continue;

    await sendOrderEventMessage(order, 'order_pending_reminder');
    sent++;
  }

  logger.info(`[cron] order pending reminders sent: ${sent}`);
  return { sent };
}

/* ─── 4. CRON: Wishlist abandoned (daily) ─── */
export async function processWishlistAbandoned(): Promise<{ sent: number }> {
  const Wishlist = (await import('@/db/models/wishlistModel')).default;

  // Items > 3 days old in wishlist
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const groups = await Wishlist.aggregate([
    { $match: { createdAt: { $lte: cutoff } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ]);

  let sent = 0;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const group of groups) {
    // Dedup — ek hafte me ek hi message
    const before = await MessageLog.exists({
      userId: group._id,
      triggerType: 'wishlist_abandoned',
      createdAt: { $gte: oneWeekAgo },
    });
    if (before) continue;

    const user = await User.findById(group._id);
    if (!user?.email) continue;

    const config = MESSAGES.wishlist_abandoned;
    const vars = {
      userName: user.username || 'Customer',
      itemCount: String(group.count),
    };

    const subject = renderTemplate(config.subject, vars);
    const body = renderTemplate(config.body, vars);

    const log = await MessageLog.create({
      userId: user._id,
      channel: 'email',
      triggerType: 'wishlist_abandoned',
      subject,
      body,
      status: 'pending',
      meta: { count: group.count },
    });

    try {
      await enqueueEmail({
        type: 'custom-email',
        payload: { email: user.email, subject, body, logId: String(log._id) },
      });
      log.status = 'sent';
      log.sentAt = new Date();
      await log.save();
      sent++;
    } catch (e) {
      log.status = 'failed';
      log.error = (e as Error).message;
      await log.save();
    }
  }

  logger.info(`[cron] wishlist abandoned sent: ${sent}`);
  return { sent };
}