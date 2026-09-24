import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './return-policy.controller';
import { listQuerySchema, upsertSchema } from './return-policy.validation';

const router = Router();
router.get('/all', controller.options);
router.get('/', ...requireAdmin, validate(listQuerySchema, 'query'), controller.adminList);
router.post('/', ...requireAdmin, validate(upsertSchema), controller.create);
router.get('/:id', ...requireAdmin, controller.byId);
router.put('/:id', ...requireAdmin, validate(upsertSchema.partial()), controller.update);
router.delete('/:id', ...requireAdmin, controller.remove);
export default router;
