import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { sendOk } from '@/utils/api-response';
import { UnauthorizedError } from '@/utils/errors';
import * as service from './payment.service';

/* PhonePe initiate */
export const phonePeInitiate = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.phonePeInitiate(req.body as {
    orderId: string;
    amount: number;
    transactionId: string;
    userDetails?: { name?: string; email?: string; phone?: string };
  });
  return res.json(data);
});

/* PhonePe callback */
export const phonePeCallback = asyncHandler(async (req: Request, res: Response) => {
  const body = (req.body as Record<string, string>) ?? {};
  const query = (req.query as Record<string, string>) ?? {};
  const mtid =
    body.merchantTransactionId || body.transactionId || query.merchantTransactionId || query.transactionId || '';
  const result = await service.phonePeCallback(mtid);
  return res.redirect(result.status, result.redirectTo);
});

/* Razorpay create */
export const razorpayCreate = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.razorpayCreate(req.body as { _id: string; amount: number; orderId: string });
  return res.json(data);
});

/* Free order confirm (100% coupon → payable 0) */
export const confirmFreeOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  const { _id } = (req.body as { _id?: string }) ?? {};
  if (!_id) throw new UnauthorizedError('Order id required');
  const result = await service.confirmFreeOrder(req.user.id, _id);
  return sendOk(res, result as Record<string, unknown>);
});

/* Razorpay verify */
export const razorpayVerify = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.razorpayVerify(req.body as {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  });
  return sendOk(res, result as Record<string, unknown>);
});

/* Razorpay webhook (raw body required) */
export const razorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = (req.headers['x-razorpay-signature'] as string) ?? '';
  // raw body captured by the route's middleware
  const raw = (req as unknown as { rawBody?: string }).rawBody ?? JSON.stringify(req.body);
  const result = await service.razorpayWebhook(raw, signature);
  return res.json(result);
});
