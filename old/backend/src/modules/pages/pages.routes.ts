import { Router } from 'express';
import { requireAuth, requireRole } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './pages.controller';
import { updatePageSchema } from './pages.validation';

const router = Router();

/* ─── Public ───────────────────────────────── */
router.get('/:slug', controller.getPageBySlug);

/* ─── Admin ────────────────────────────────── */
router.get(
  '/',
  requireAuth,
  requireRole('admin'),
  controller.listPagesAdmin
);

router.put(
  '/:slug',
  requireAuth,
  requireRole('admin'),
  validate(updatePageSchema),
  controller.updatePage
);

export default router;