import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './warranty.controller';
import { listQuerySchema, patchSchema, upsertSchema } from './warranty.validation';

const router = Router();
router.get('/all', controller.options);
router.get('/', ...requireAdmin, validate(listQuerySchema, 'query'), controller.adminList);
router.post('/', ...requireAdmin, validate(upsertSchema), controller.create);
router.get('/:id', ...requireAdmin, controller.byId);
router.put('/:id', ...requireAdmin, validate(upsertSchema.partial()), controller.update);
router.delete('/:id', ...requireAdmin, controller.remove);
router.patch('/:id', ...requireAdmin, validate(patchSchema), controller.patchStatus);
export default router;
