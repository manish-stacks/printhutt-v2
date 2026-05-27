import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './shipping.controller';
import { listQuerySchema, upsertSchema } from './shipping.validation';

const router = Router();

// Public/webhook
router.post('/track', controller.fshipTrack);
router.get('/shiprocket/track/:awb', controller.shiprocketTrack);
router.post('/shiprocket/create-order', ...requireAdmin, controller.shiprocketCreateOrder);
router.post('/shiprocket/webhook', controller.shiprocketWebhook);

// Admin
router.get('/all', controller.options);
router.get('/', ...requireAdmin, validate(listQuerySchema, 'query'), controller.adminList);
router.post('/', ...requireAdmin, validate(upsertSchema), controller.create);
router.get('/:id', ...requireAdmin, controller.byId);
router.put('/:id', ...requireAdmin, validate(upsertSchema.partial()), controller.update);
router.delete('/:id', ...requireAdmin, controller.remove);
export default router;
