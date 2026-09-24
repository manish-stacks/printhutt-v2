import { Router } from 'express';
import { requireAuth, requireRole } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './users.controller';
import { blockUserSchema, listUsersQuerySchema, updateProfileSchema } from './users.validation';

const router = Router();

/* ─── Admin ──────────────────────────────────────────────────── */
router.get('/', requireAuth, requireRole('admin'), validate(listUsersQuerySchema, 'query'), controller.adminList);

// Excel export — :id route se PEHLE (warna "export" ko id samjhega)
router.get('/export/excel', requireAuth, requireRole('admin'), controller.exportUsersExcel);

// Full user detail
router.get('/:id/full', requireAuth, requireRole('admin'), controller.userFullDetail);

/* ─── User self-service ──────────────────────────────────────── */
router.get('/me', requireAuth, controller.userDashboard);
router.post('/me/profile', requireAuth, validate(updateProfileSchema), controller.updateProfile);
router.patch(
  '/:id/block',
  requireAuth,
  requireRole('admin'),
  validate(blockUserSchema),
  controller.setBlockStatus
);

export default router;