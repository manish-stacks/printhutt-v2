import express, { Router } from 'express';
import * as controller from './payment.controller';

const router = Router();

/* PhonePe */
router.post('/initiate', controller.phonePeInitiate);
router.post('/callback', express.urlencoded({ extended: true }), controller.phonePeCallback);

/* Razorpay */
router.post('/razorpay/create-order', controller.razorpayCreate);
router.post('/razorpay/verify', controller.razorpayVerify);
// Razorpay webhook needs raw body for HMAC verification
router.post(
  '/razorpay/webhooks',
  express.raw({ type: '*/*' }),
  (req, _res, next) => {
    (req as unknown as { rawBody: string }).rawBody = (req.body as Buffer).toString('utf8');
    // parse it as json for downstream
    try {
      req.body = JSON.parse((req as unknown as { rawBody: string }).rawBody);
    } catch {
      req.body = {};
    }
    next();
  },
  controller.razorpayWebhook
);

export default router;
