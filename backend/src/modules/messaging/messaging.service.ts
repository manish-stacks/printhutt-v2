import MessageTemplate from '@/db/models/messageTemplate.model';
import MessageLog from '@/db/models/messageLog.model';
import User from '@/db/models/userModel';
import { enqueueEmail } from '@/queues/queues';
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { logger } from '@/config/logger';

/* Placeholder replacer — {{userName}}, {{productName}}, {{orderId}} */
function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

/* ─── Manual send (admin) ─── */
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

  // Log entry
  const log = await MessageLog.create({
    userId: user._id,
    channel: opts.channel,
    triggerType: 'manual',
    subject: opts.subject,
    body: opts.body,
    status: 'pending',
  });

  // Enqueue via BullMQ
  try {
    await enqueueEmail({
      type: opts.channel === 'email' ? 'custom-email' : 'custom-sms',
      payload: {
        email: user.email,
        mobile: user.number,
        subject: opts.subject || 'Message from PrintHutt',
        body: opts.body,
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

  return { success: true, message: 'Message queued successfully', logId: log._id };
}

/* ─── Template CRUD ─── */
export const listTemplates = () => MessageTemplate.find().sort({ createdAt: -1 }).lean();

export async function createTemplate(data: any) {
  return MessageTemplate.create(data);
}

export async function updateTemplate(id: string, data: any) {
  const t = await MessageTemplate.findByIdAndUpdate(id, data, { new: true });
  if (!t) throw new NotFoundError('Template not found');
  return t;
}

export async function deleteTemplate(id: string) {
  const t = await MessageTemplate.findByIdAndDelete(id);
  if (!t) throw new NotFoundError('Template not found');
  return { success: true };
}

/* ─── Auto-trigger jobs ─── */

/* Order pending reminder — orders pending for X hours */
export async function processOrderPendingReminders(): Promise<{ sent: number }> {
  const Order = (await import('@/db/models/orderModel')).default;

  const templates = await MessageTemplate.find({
    triggerType: 'order_pending_reminder',
    enabled: true,
  });

  if (templates.length === 0) return { sent: 0 };

  let sent = 0;

  for (const template of templates) {
    const delayHours = template.delayHours || 24;
    const cutoff = new Date(Date.now() - delayHours * 60 * 60 * 1000);

    const orders = await Order.find({
      status: 'pending',
      createdAt: { $lte: cutoff },
    }).populate('user', 'username email number');

    for (const order of orders as any[]) {
      const user = order.user;
      if (!user) continue;

      // Already reminded for this order? (avoid spam)
      const alreadyReminded = await MessageLog.exists({
        userId: user._id,
        triggerType: 'order_pending_reminder',
        'meta.orderId': order.orderId,
      });
      if (alreadyReminded) continue;

      const vars = {
        userName: user.username || 'Customer',
        orderId: order.orderId,
        totalAmount: String(order.totalAmount?.discountPrice || 0),
      };

      const rendered = renderTemplate(template.body, vars);
      const subject = template.subject
        ? renderTemplate(template.subject, vars)
        : `Complete your order #${order.orderId}`;

      const log = await MessageLog.create({
        userId: user._id,
        channel: template.channel,
        triggerType: 'order_pending_reminder',
        subject,
        body: rendered,
        status: 'pending',
        meta: { orderId: order.orderId, templateId: template._id },
      });

      try {
        await enqueueEmail({
          type: template.channel === 'email' ? 'custom-email' : 'custom-sms',
          payload: {
            email: user.email,
            mobile: user.number,
            subject,
            body: rendered,
            logId: String(log._id),
          },
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
  }

  logger.info(`Order pending reminders sent: ${sent}`);
  return { sent };
}

/* Wishlist abandoned — items in wishlist > X days */
export async function processWishlistAbandoned(): Promise<{ sent: number }> {
  const Wishlist = (await import('@/db/models/wishlistModel')).default;

  const templates = await MessageTemplate.find({
    triggerType: 'wishlist_abandoned',
    enabled: true,
  });

  if (templates.length === 0) return { sent: 0 };

  let sent = 0;

  for (const template of templates) {
    const delayHours = template.delayHours || 72; // default 3 days
    const cutoff = new Date(Date.now() - delayHours * 60 * 60 * 1000);

    // Find wishlist items added before cutoff, group by user
    const items = await Wishlist.aggregate([
      { $match: { createdAt: { $lte: cutoff } } },
      {
        $group: {
          _id: '$userId',
          productIds: { $push: '$productId' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ]);

    for (const entry of items) {
      const user = entry.user;
      if (!user) continue;

      // Already reminded this user this week?
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const alreadyReminded = await MessageLog.exists({
        userId: user._id,
        triggerType: 'wishlist_abandoned',
        createdAt: { $gte: oneWeekAgo },
      });
      if (alreadyReminded) continue;

      const vars = {
        userName: user.username || 'Customer',
        itemCount: String(entry.count),
      };

      const rendered = renderTemplate(template.body, vars);
      const subject = template.subject
        ? renderTemplate(template.subject, vars)
        : 'Items in your wishlist are waiting!';

      const log = await MessageLog.create({
        userId: user._id,
        channel: template.channel,
        triggerType: 'wishlist_abandoned',
        subject,
        body: rendered,
        status: 'pending',
        meta: { templateId: template._id, count: entry.count },
      });

      try {
        await enqueueEmail({
          type: template.channel === 'email' ? 'custom-email' : 'custom-sms',
          payload: {
            email: user.email,
            mobile: user.number,
            subject,
            body: rendered,
            logId: String(log._id),
          },
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
  }

  logger.info(`Wishlist abandoned reminders sent: ${sent}`);
  return { sent };
}