/**
 * Order confirm hone par EK hi baar:
 *   1. Stock kam
 *   2. Email (customer + owner)
 *   3. WhatsApp (customer)
 *
 * Razorpay me verify (frontend) + webhook (server) DONO fire hote hain — isliye
 * yahan ATOMIC dedup hai (confirmationSent flag). Pehla call jeetega, doosra skip.
 * Isse customer ko double email/whatsapp NAHI jayega aur stock double kam NAHI hoga.
 */
import Order from '@/db/models/orderModel';
import User from '@/db/models/userModel';
import { logger } from '@/config/logger';
import { reduceStockForOrder } from '@/utils/stock';

export async function finalizeConfirmedOrder(orderId: unknown): Promise<void> {
  try {
    // 🔒 Atomic gate: confirmationSent false → true. Sirf jeetne wala aage badhega.
    const order: any = await Order.findOneAndUpdate(
      { _id: orderId, confirmationSent: { $ne: true } },
      { $set: { confirmationSent: true } },
      { new: true }
    ).populate({ path: 'userId', model: User });

    if (!order) {
      logger.debug(`[confirm] order ${orderId} already finalized — skip duplicate`);
      return;
    }

    // 1) Stock kam (khud bhi idempotent hai)
    await reduceStockForOrder(order);

    // 1b) ✅ Coupon usage record karo (sirf paid+confirmed order par — usageLimit
    //     aur per-user one-time isi se enforce hota hai, Bug #7)
    try {
      const couponCode = order?.coupon?.code;
      if (couponCode) {
        const Coupon = (await import('@/db/models/couponModel')).default;
        const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
        if (coupon) {
          await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
          const uid = order?.userId?._id ?? order?.userId;
          if (uid) {
            await User.updateOne(
              { _id: uid },
              { $addToSet: { couponCollection: String(coupon._id) } }
            );
          }
        }
      }
    } catch (err) {
      logger.error('[confirm] coupon usage update failed', err);
    }

    // 2) + 3) Email + WhatsApp (mailer dono handle karta hai, ek dusre se independent)
    try {
      const mailer = (await import('@/utils/mail/mailer')) as unknown as {
        sendOrderConfirmationEmail?: (o: unknown) => Promise<unknown>;
      };
      await mailer.sendOrderConfirmationEmail?.(order);
    } catch (err) {
      logger.error('[confirm] notification failed', err);
    }

    logger.info(`[confirm] order ${order.orderId} finalized (stock + email + whatsapp)`);
  } catch (e) {
    logger.error('[confirm] finalizeConfirmedOrder failed', e);
  }
}
