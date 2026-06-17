import MessageLog from '@/db/models/messageLog.model';
import User from '@/db/models/userModel';
import { enqueueEmail } from '@/queues/queues';
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { logger } from '@/config/logger';
import axios from 'axios';

/* ─── WhatsApp API helper (same as mailer.ts) ─── */
const WA_BASE =
  `http://waapi.hoverbusinessservices.com/api/sendmsgutil.php` +
  `?user=Printhutt_BW&pass=123456&sender=BUZWAP&priority=wa&stype=normal`;

async function sendWhatsApp(
  phone: string,
  templateName: string,
  params: string[]
): Promise<void> {
  const url =
    `${WA_BASE}` +
    `&phone=${phone}` +
    `&text=${templateName}` +
    `&Params=${encodeURIComponent(params.join(','))}`;

  const res = await axios.get(url, { timeout: 8000 });
  logger.info(`[whatsapp] ${templateName} → ${phone}`, res.data);
}

/* ─── WhatsApp Template mapping ───────────────────────────────────────────────
   Ye templates aapke WhatsApp Business API provider mein approve hone chahiye
   Template names: printhutt_order_confirmation, printhutt_order_failed, printhutt_pending_reminders
─────────────────────────────────────────────────────────────────────────────── */
export const WHATSAPP_TEMPLATES: Record<string, string> = {
  order_confirm:           'printhutt_order_confirmation',
  order_failed:            'printhutt_order_failed',
  order_pending_reminder:  'printhutt_pending_reminders',
};

function getWhatsAppParams(
  event: string,
  order: any,
  vars: Record<string, string>
): string[] {
  const name   = vars.userName;
  const oid    = vars.orderId;
  const amt    = vars.totalAmount;
  const status = order.status || 'pending';
  const pay    = order.paymentType === 'online' ? 'Prepaid' : 'COD';
  const addr   = order.shipping
    ? `${order.shipping.addressLine || ''}, ${order.shipping.city || ''}, ${order.shipping.state || ''} ${order.shipping.postCode || ''}`.trim()
    : '';

  switch (event) {
    case 'order_confirm':
      // {{1}} name, {{2}} orderId, {{3}} status, {{4}} payType, {{5}} totalAmt, {{6}} payAmt, {{7}} address
      return [name, oid, status, pay, `₹${amt}`, `₹${order.payAmt || amt}`, addr];

    case 'order_failed':
      // {{1}} name, {{2}} orderId, {{3}} cartLink
      return [name, oid, 'https://www.printhutt.com/cart'];

    case 'order_pending_reminder':
      // {{1}} name, {{2}} orderId, {{3}} amount, {{4}} cartLink
      return [name, oid, `₹${amt}`, 'https://www.printhutt.com/cart'];

    default:
      return [name, oid];
  }
}

/* ─── HARDCODED EMAIL MESSAGES — yahan edit karo ─── */
export const MESSAGES = {
  order_confirm: {
    channel: 'email' as const,
    subject: '🎉 Order Confirmed! - #{{orderId}} | PrintHutt',
    body: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 15px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
<tr><td align="center" style="background:linear-gradient(135deg,#9333ea,#ec4899);padding:36px 20px;">
<img src="https://www.printhutt.com/print-hutt-logo.webp" alt="PrintHutt" width="110" style="margin-bottom:12px;"/>
<h1 style="margin:0;color:#fff;font-size:26px;">PrintHutt</h1>
<p style="margin:8px 0 0;color:#fce7f3;font-size:14px;">Premium Personalized Gifts</p>
</td></tr>
<tr><td style="padding:40px 35px;">
<h2 style="margin:0 0 8px;font-size:26px;color:#16a34a;">✅ Order Confirmed!</h2>
<p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.7;">Hi <b>{{userName}}</b>, your order has been placed successfully! 🎉</p>
<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Order ID</p>
<p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">#{{orderId}}</p>
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Amount Paid</p>
<p style="margin:0;font-size:20px;font-weight:700;color:#9333ea;">₹{{totalAmount}}</p>
</div>
<div style="text-align:center;margin:28px 0;">
<a href="{{trackLink}}" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">Track My Order →</a>
</div>
<p style="margin:0;color:#6b7280;font-size:14px;line-height:1.7;">Thank you for shopping with PrintHutt! We're preparing your personalized gift with love. 💜</p>
</td></tr>
<tr><td style="background:#f3f4f6;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:12px;color:#9ca3af;">© PrintHutt · <a href="https://printhutt.com" style="color:#9333ea;">printhutt.com</a></p>
</td></tr>
</table></td></tr></table></body></html>`,
  },
  order_failed: {
    channel: 'email' as const,
    subject: '⚠️ Payment Failed - #{{orderId}} | PrintHutt',
    body: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 15px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
<tr><td align="center" style="background:linear-gradient(135deg,#9333ea,#ec4899);padding:36px 20px;">
<img src="https://www.printhutt.com/print-hutt-logo.webp" alt="PrintHutt" width="110" style="margin-bottom:12px;"/>
<h1 style="margin:0;color:#fff;font-size:26px;">PrintHutt</h1>
</td></tr>
<tr><td style="padding:40px 35px;">
<h2 style="margin:0 0 8px;font-size:26px;color:#dc2626;">❌ Payment Failed</h2>
<p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.7;">Hi <b>{{userName}}</b>, your payment for order <b>#{{orderId}}</b> could not be completed. No amount has been deducted.</p>
<div style="text-align:center;margin:28px 0;">
<a href="{{cartLink}}" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">Retry Payment →</a>
</div>
<p style="margin:0;color:#6b7280;font-size:14px;">Need help? <a href="mailto:printhutt05@gmail.com" style="color:#9333ea;">printhutt05@gmail.com</a></p>
</td></tr>
<tr><td style="background:#f3f4f6;padding:20px;text-align:center;">
<p style="margin:0;font-size:12px;color:#9ca3af;">© PrintHutt · <a href="https://printhutt.com" style="color:#9333ea;">printhutt.com</a></p>
</td></tr>
</table></td></tr></table></body></html>`,
  },
  order_pending_reminder: {
    channel: 'email' as const,
    subject: '⏳ Complete Your Order - #{{orderId}} | PrintHutt',
    body: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 15px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
<tr><td align="center" style="background:linear-gradient(135deg,#9333ea,#ec4899);padding:36px 20px;">
<img src="https://www.printhutt.com/print-hutt-logo.webp" alt="PrintHutt" width="110" style="margin-bottom:12px;"/>
<h1 style="margin:0;color:#fff;font-size:26px;">PrintHutt</h1>
</td></tr>
<tr><td style="padding:40px 35px;">
<h2 style="margin:0 0 8px;font-size:26px;color:#d97706;">⏳ Your Order is Pending!</h2>
<p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.7;">Hi <b>{{userName}}</b>, your order <b>#{{orderId}}</b> is still waiting for payment. Complete it before your items run out!</p>
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Order Amount</p>
<p style="margin:0;font-size:24px;font-weight:700;color:#9333ea;">₹{{totalAmount}}</p>
</div>
<div style="text-align:center;margin:28px 0;">
<a href="{{cartLink}}" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">Complete Payment Now →</a>
</div>
</td></tr>
<tr><td style="background:#f3f4f6;padding:20px;text-align:center;">
<p style="margin:0;font-size:12px;color:#9ca3af;">© PrintHutt · <a href="https://printhutt.com" style="color:#9333ea;">printhutt.com</a></p>
</td></tr>
</table></td></tr></table></body></html>`,
  },
  wishlist_abandoned: {
    channel: 'email' as const,
    subject: '💝 Items waiting in your wishlist | PrintHutt',
    body: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 15px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden;">
<tr><td align="center" style="background:linear-gradient(135deg,#9333ea,#ec4899);padding:36px 20px;">
<img src="https://www.printhutt.com/print-hutt-logo.webp" alt="PrintHutt" width="110" style="margin-bottom:12px;"/>
<h1 style="margin:0;color:#fff;font-size:26px;">PrintHutt</h1>
</td></tr>
<tr><td style="padding:40px 35px;">
<h2 style="margin:0 0 8px;font-size:26px;color:#9333ea;">💝 Don't Forget Your Wishlist!</h2>
<p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.7;">Hi <b>{{userName}}</b>, you have <b>{{itemCount}} items</b> waiting in your wishlist. They're perfect for gifting!</p>
<div style="text-align:center;margin:28px 0;">
<a href="https://printhutt.com/wishlist" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">View My Wishlist →</a>
</div>
</td></tr>
<tr><td style="background:#f3f4f6;padding:20px;text-align:center;">
<p style="margin:0;font-size:12px;color:#9ca3af;">© PrintHutt · <a href="https://printhutt.com" style="color:#9333ea;">printhutt.com</a></p>
</td></tr>
</table></td></tr></table></body></html>`,
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

  if (opts.channel === 'email' && (!user.email || !user.email.includes('@'))) {
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

    const orderEmail = order.shipping?.email;
    const orderPhone = order.shipping?.mobileNumber;
    const orderName  = order.shipping?.userName;

    let user: any = null;
    if (userId) user = await User.findById(userId);

    const toEmail = orderEmail || user?.email;
    const toPhone = orderPhone || String(user?.number || '');
    const toName  = orderName  || user?.username || 'Customer';

    if (!toEmail && !toPhone) {
      logger.warn(`[messaging] no email/phone for order ${order.orderId} — skipping`);
      return;
    }

    // 🔒 DEDUP
    const exists = await MessageLog.findOne({
      triggerType: event,
      'meta.orderId': order.orderId,
    });
    if (exists) {
      logger.debug(`[messaging] dedup skip — ${event} already sent for ${order.orderId}`);
      return;
    }

    const config = MESSAGES[event];
    const vars = {
      userName:    toName,
      orderId:     String(order.orderId || ''),
      totalAmount: String(order.totalAmount?.discountPrice || order.totalAmount || 0),
      cartLink:    'https://www.printhutt.com/cart',
      trackLink:   `https://www.printhutt.com/order-track/${order.orderId}`,
    };

    const subject = renderTemplate(config.subject, vars);
    const body    = renderTemplate(config.body, vars);

    // ✅ FIX 1: channel 'both' → 'email' — MessageLog enum mein 'both' valid nahi tha
    //    Ye Mongoose validation error throw karta tha → log create fail → kuch nahi bhejta
    // ✅ FIX 2: userId required: true — agar user null hai to dummy ObjectId use karo
    const logUserId = user?._id || new (await import('mongoose')).default.Types.ObjectId();

    const log = await MessageLog.create({
      userId:      logUserId,
      channel:     'email',             // ← 'both' nahi, enum-safe value
      triggerType: event,
      subject,
      body,
      status:      'pending',
      meta:        { orderId: order.orderId },
    });

    const promises: Promise<any>[] = [];

    // ── EMAIL ──
    if (toEmail && toEmail.includes('@')) {
      promises.push(
        enqueueEmail({
          type: 'custom-email',
          payload: { email: toEmail, subject, body, logId: String(log._id) },
        }).catch(e => logger.error('[messaging] email enqueue failed', e))
      );
    }

    // ── WHATSAPP ──
    if (toPhone) {
      const waTemplate = WHATSAPP_TEMPLATES[event];
      if (waTemplate) {
        const waParams = getWhatsAppParams(event, order, vars);
        promises.push(
          sendWhatsApp(toPhone, waTemplate, waParams)
            .catch(e => logger.error('[messaging] whatsapp failed', e))
        );
      }
    }

    await Promise.all(promises);

    log.status = 'sent';
    log.sentAt = new Date();
    await log.save();

    logger.info(`[messaging] ${event} → email+whatsapp sent for order ${order.orderId}`);
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