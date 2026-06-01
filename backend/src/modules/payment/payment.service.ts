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
import { logger } from '@/config/logger';
import { BadRequestError, NotFoundError } from '@/utils/errors';
import Order from '@/db/models/orderModel';
import User from '@/db/models/userModel';
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
  const response = await phonePe.initiatePayment(
    body.amount,
    body.transactionId,
    callbackUrl,
    body.userDetails
  );
  if (!response.success) {
    throw new BadRequestError(response.error || 'Payment initiation failed');
  }
  const order = await Order.findById(body.orderId);
  if (order) {
    (order as unknown as { payment: { transactionId?: string } }).payment.transactionId =
      (response.data as { merchantTransactionId?: string })?.merchantTransactionId ?? '';
    await order.save();
  }
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
  if (!response.success) {
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

  try {
    const mailer = (await import('@/utils/mail/mailer')) as unknown as {
      sendOrderConfirmationEmail?: (o: unknown) => Promise<unknown>;
    };
    await mailer.sendOrderConfirmationEmail?.(order);
  } catch (err) {
    logger.error('PhonePe confirmation email failed', err);
  }
  return { redirectTo: `${base}/orders/confirmation?success=true`, status: 301 };
}

/* ───────────────── Razorpay ───────────────── */
export async function razorpayCreate(body: { _id: string; amount: number; orderId: string }): Promise<unknown> {
  const rp = await razorpay.orders.create({
    amount: Math.round(body.amount * 100),
    currency: 'INR',
    receipt: body._id,
    notes: { orderId: body.orderId },
  });
  const order = await Order.findOne({ orderId: body.orderId });
  if (!order) throw new NotFoundError('Order not found');
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

  try {
    const mailer = (await import('@/utils/mail/mailer')) as unknown as {
      sendOrderConfirmationEmail?: (o: unknown) => Promise<unknown>;
    };
    await mailer.sendOrderConfirmationEmail?.(order);
  } catch (err) {
    logger.error('Razorpay confirmation email failed', err);
  }
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
