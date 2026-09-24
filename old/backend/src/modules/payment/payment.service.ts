/**
 * Payment service. Direct port of:
 *   src/app/api/payment/initiate/route.ts          (PhonePe init)
 *   src/app/api/payment/callback/route.ts          (PhonePe callback)
 *   src/app/api/payment/razorpay/create-order      (Razorpay create)
 *   src/app/api/payment/razorpay/verify            (Razorpay verify)
 *   src/app/api/payment/razorpay/webhooks          (Razorpay webhook)
 */
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '@/config/env';
import { BadRequestError, NotFoundError } from '@/utils/errors';
import Order from '@/db/models/orderModel';
import User from '@/db/models/userModel';
import { finalizeConfirmedOrder } from '@/utils/order-confirm';
import { PhonePePayment } from './phonepe';

const phonePe = new PhonePePayment(
  env.PHONEPE_MERCHANT_ID ?? '',
  env.PHONEPE_SALT_KEY ?? '',
  env.PHONEPE_SALT_INDEX ?? '',
  env.NODE_ENV === 'production' ? 'PROD' : 'UAT'
);

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID ?? '',
  key_secret: env.RAZORPAY_KEY_SECRET ?? '',
});


/* ───────────────── PhonePe ───────────────── */
export async function phonePeInitiate(body: {
  orderId: string;
  amount: number;
  transactionId: string;
  userDetails?: { name?: string; email?: string; phone?: string };
}): Promise<Record<string, unknown>> {
  const callbackUrl = `${env.API_URL}/api/payment/callback`;

  // 🔐 Amount client se NAHI — DB stored payAmt authoritative (order create par recompute).
  const order = await Order.findById(body.orderId);
  if (!order) throw new NotFoundError('Order not found');
  const serverAmount = Number((order as unknown as { payAmt?: string | number }).payAmt);
  if (!serverAmount || serverAmount < 1) {
    throw new BadRequestError('Amount is zero — use free order confirmation flow.');
  }

  const response = await phonePe.initiatePayment(
    serverAmount,
    body.transactionId,
    callbackUrl,
    body.userDetails
  );
  if (!response.success) {
    throw new BadRequestError(response.error || 'Payment initiation failed');
  }
  (order as unknown as { payment: { transactionId?: string } }).payment.transactionId =
    (response.data as { merchantTransactionId?: string })?.merchantTransactionId ?? '';
  await order.save();
  return (response.data as Record<string, unknown>) ?? {};
}

export interface PhonePeCallbackResult {
  redirectTo: string;
  status: number;
}

export async function phonePeCallback(merchantTransactionId: string): Promise<PhonePeCallbackResult> {
  const base = env.APP_URL;
  if (!merchantTransactionId) throw new BadRequestError('merchantTransactionId is required');

  const response = await phonePe.checkStatus(merchantTransactionId);
  console.log('PhonePe callback response:', response);
  if (!response.success || response.code == 'PAYMENT_PENDING') {
    return { redirectTo: `${base}/orders/payment-failure`, status: 301 };
  }

  const order = await Order.findOne({ orderId: merchantTransactionId }).populate({
    path: 'userId',
    model: User,
  });
  if (!order) {
    return {
      redirectTo: `${base}/orders/confirmation?id=${merchantTransactionId}&success=false`,
      status: 301,
    };
  }

  const d = (response.data ?? {}) as {
    transactionId?: string;
    paymentInstrument?: { type?: string };
  };
  (order as unknown as { payment: Record<string, unknown> }).payment = {
    transactionId: d.transactionId,
    isPaid: true,
    paidAt: new Date(),
    method: d.paymentInstrument?.type || 'unknown',
  };
  order.status = 'confirmed';
  await order.save();

  // 🔒 Ek hi baar: stock + email + whatsapp (idempotent)
  await finalizeConfirmedOrder(order._id);

  return { redirectTo: `${base}/orders/confirmation?success=true`, status: 301 };
}

/* ───────────────── Razorpay ───────────────── */
export async function razorpayCreate(body: { _id: string; amount: number; orderId: string }): Promise<unknown> {
  const order = await Order.findOne({ orderId: body.orderId });
  if (!order) throw new NotFoundError('Order not found');

  // 🔐 Amount client se NAHI lete — DB me store payAmt hi authoritative hai.
  //    (Order create par payAmt server-side recompute hota hai — coupon re-validated.)
  const serverAmount = Number((order as unknown as { payAmt?: string | number }).payAmt);

  // ✅ Razorpay min ₹1 (100 paise). 100% coupon par amount 0 → free order flow use hota hai (Bug #6).
  if (!serverAmount || serverAmount < 1) {
    throw new BadRequestError('Amount is zero — use free order confirmation flow.');
  }

  const rp = await razorpay.orders.create({
    amount: Math.round(serverAmount * 100),
    currency: 'INR',
    receipt: body._id,
    notes: { orderId: body.orderId },
  });
  (order as unknown as { razorpayOrderId: string }).razorpayOrderId = rp.id;
  await order.save();
  return {
    key: env.RAZORPAY_KEY_ID,
    razorpayOrderId: rp.id,
    amount: rp.amount,
    orderId: body.orderId,
    customerName: (order as unknown as { shipping?: { userName?: string } }).shipping?.userName || 'User',
    customerEmail:
      (order as unknown as { shipping?: { email?: string } }).shipping?.email || 'admin@gmail.com',
    customerPhone:
      (order as unknown as { shipping?: { mobileNumber?: string } }).shipping?.mobileNumber || '1234567890',
  };
}

/* ───────────────── Free Order (100% coupon → payable 0) ───────────────── */
/**
 * Jab coupon ke baad payable amount 0 ho jaye (100% / full discount), tab koi
 * payment gateway call nahi hoti (Razorpay/PhonePe ₹0 reject karte hain — Bug #6).
 * Yahan order ko server-side verify karke seedha PAID + CONFIRMED mark karte hain,
 * fir wahi idempotent side-effects (stock + email + whatsapp) chalte hain.
 */
export async function confirmFreeOrder(userId: string, orderMongoId: string): Promise<unknown> {
  const order = await Order.findById(orderMongoId).populate({ path: 'userId', model: User });
  if (!order) throw new NotFoundError('Order not found');

  // 🔒 Ownership check — koi dusre ka order confirm na kar de
  const rawOwner =
    (order as unknown as { userId?: { _id?: unknown } }).userId?._id ??
    (order as unknown as { userId?: unknown }).userId;
  if (String(rawOwner) !== String(userId)) {
    throw new BadRequestError('Order does not belong to this user');
  }

  // 🔒 Server-side amount check — client par bharosa nahi.
  const payable = Number((order as unknown as { payAmt?: string | number }).payAmt);
  if (payable > 0.5) {
    throw new BadRequestError('This order is not free — payment required.');
  }

  const o = order as unknown as {
    payment: Record<string, unknown>;
    status: string;
    save: () => Promise<unknown>;
  };
  if (o.payment?.isPaid) {
    return { success: true, alreadyConfirmed: true, order };
  }

  o.payment = {
    transactionId: `FREE-${Date.now()}`,
    isPaid: true,
    paidAt: new Date(),
    method: 'coupon_full_discount',
    paymentPartner: 'free',
  };
  o.status = 'confirmed';
  await o.save();

  // Stock + email + whatsapp (idempotent)
  await finalizeConfirmedOrder((order as unknown as { _id: unknown })._id);

  return { success: true, order };
}

export async function razorpayVerify(body: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}): Promise<unknown> {
  const signString = `${body.razorpay_order_id}|${body.razorpay_payment_id}`;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET ?? '')
    .update(signString)
    .digest('hex');
  if (expected !== body.razorpay_signature) throw new BadRequestError('Invalid signature');

  const order = await Order.findOne({ razorpayOrderId: body.razorpay_order_id }).populate({
    path: 'userId',
    model: User,
  });
  if (!order) throw new NotFoundError('Order not found');

  (order as unknown as { payment: Record<string, unknown> }).payment = {
    transactionId: body.razorpay_payment_id,
    isPaid: true,
    paidAt: new Date(),
    method: 'razorpay',
    paymentPartner: 'razorpay',
  };
  order.status = 'confirmed';
  await order.save();

  // 🔒 Ek hi baar: stock + email + whatsapp (idempotent — webhook se duplicate nahi)
  await finalizeConfirmedOrder(order._id);

  return { success: true, order };
}

export async function razorpayWebhook(rawBody: string, signature: string): Promise<unknown> {
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET ?? '')
    .update(rawBody)
    .digest('hex');
  if (expected !== signature) throw new BadRequestError('Invalid signature');

  const event = JSON.parse(rawBody) as {
    event: string;
    payload: { payment?: { entity: Record<string, unknown> }; refund?: { entity: Record<string, unknown> } };
  };

  switch (event.event) {
    case 'payment.captured': {
      const payment = event.payload.payment?.entity ?? {};
      const order = await Order.findOne({ razorpayOrderId: payment.order_id as string });
      const p = order as unknown as { payment?: { isPaid?: boolean } };
      if (order && !p.payment?.isPaid) {
        (order as unknown as { payment: Record<string, unknown> }).payment = {
          transactionId: payment.id,
          isPaid: true,
          paidAt: new Date((payment.created_at as number) * 1000),
          method: payment.method,
          paymentPartner: 'razorpay',
        };
        order.status = 'confirmed';
        await order.save();

        // 🔒 Ek hi baar: stock + email + whatsapp (verify se duplicate nahi)
        await finalizeConfirmedOrder(order._id);
      }
      break;
    }
    case 'payment.failed': {
      const payment = event.payload.payment?.entity ?? {};
      const order = await Order.findOne({ razorpayOrderId: payment.order_id as string });
      const p = order as unknown as { payment?: { isPaid?: boolean } };
      if (order && !p.payment?.isPaid) {
        (order as unknown as { payment: Record<string, unknown> }).payment = { isPaid: false };
        order.status = 'cancelled';
        await order.save();
      }
      break;
    }
    case 'refund.processed': {
      const refund = event.payload.refund?.entity ?? {};
      const order = await Order.findOne({ razorpayOrderId: refund.order_id as string });
      const p = order as unknown as { payment?: { isPaid?: boolean } };
      if (order && p.payment?.isPaid) {
        (order as unknown as { payment: Record<string, unknown> }).payment = {
          transactionId: refund.payment_id,
          isPaid: false,
        };
        order.status = 'refunded';
        await order.save();
      }
      break;
    }
    default:
      break;
  }
  return { success: true };
}
