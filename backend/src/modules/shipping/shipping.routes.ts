import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './shipping.controller';
import {
  createShipmentSchema,
  listQuerySchema,
  upsertSchema,
} from './shipping.validation';

const router = Router();

/* ─── Unified shipment ops (admin) ─── */
router.post(
  '/create',
  ...requireAdmin,
  validate(createShipmentSchema),
  controller.createShipment
);
router.post('/cancel/:orderId', ...requireAdmin, controller.cancelShipment);

/* ─── Tracking (public — anyone with waybill can track) ─── */
router.get('/track/:provider/:waybill', controller.track);

/* ─── Webhooks (public — provider hits these) ─── */
router.post('/webhook/:provider', controller.webhook);

/* ─── Legacy routes (backward compat for old frontend calls) ─── */
router.post('/track', controller.fshipTrack);
router.get('/shiprocket/track/:awb', controller.shiprocketTrack);

/* ─── Shipping methods CRUD (admin) ─── */
router.get('/all', controller.options);
router.get('/', ...requireAdmin, validate(listQuerySchema, 'query'), controller.adminList);
router.post('/', ...requireAdmin, validate(upsertSchema), controller.create);
router.get('/:id', ...requireAdmin, controller.byId);
router.put('/:id', ...requireAdmin, validate(upsertSchema.partial()), controller.update);
router.delete('/:id', ...requireAdmin, controller.remove);

export default router;