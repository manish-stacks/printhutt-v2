import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth.middleware';
import { authLimiter } from '@/middlewares/rate-limit.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './auth.controller';
import {
  adminLoginSchema,
  loginRequestOtpSchema,
  signupSchema,
  verifyEmailSchema,
  verifyOtpSchema,
} from './auth.validation';

const router = Router();

/* ─── Public ─────────────────────────────────────────────────── */
router.post('/login', authLimiter, validate(loginRequestOtpSchema), controller.loginRequestOtp);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), controller.verifyOtp);
router.post('/admin-login', authLimiter, validate(adminLoginSchema), controller.adminLogin);
router.post('/signup', authLimiter, validate(signupSchema), controller.signup);
router.post('/verifyemail', authLimiter, validate(verifyEmailSchema), controller.verifyEmail);
router.post('/refresh', controller.refresh);
router.get('/logout', controller.logout);

/* ─── Authenticated ─────────────────────────────────────────── */
router.post('/me', requireAuth, controller.me);
router.post('/logout-all', requireAuth, controller.logoutAll);

export default router;
