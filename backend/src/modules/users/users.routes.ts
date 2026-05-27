import { Router } from 'express';
import { requireAuth, requireRole } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './users.controller';
import {
  listUsersQuerySchema,
  updateProfileSchema,
} from './users.validation';

const router = Router();

/* ─── Admin ──────────────────────────────────────────────────── */
// Original: GET /api/user  (admin-only listing of non-admin users)
router.get(
  '/',
  requireAuth,
  requireRole('admin'),
  validate(listUsersQuerySchema, 'query'),
  controller.adminList
);

/* ─── User self-service ──────────────────────────────────────── */
// Original: GET /api/v1/user  (user dashboard counts)
router.get('/me', requireAuth, controller.userDashboard);

// Original: POST /api/v1/user/update-profile
router.post(
  '/me/profile',
  requireAuth,
  validate(updateProfileSchema),
  controller.updateProfile
);

export default router;
