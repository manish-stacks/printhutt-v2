import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './usercart.controller';
import { addItemSchema, mergeSchema, syncSchema, updateQtySchema } from './usercart.validation';

const router = Router();

router.get('/', requireAuth, controller.getCart);
router.post('/add', requireAuth, validate(addItemSchema), controller.addItem);
router.patch('/item', requireAuth, validate(updateQtySchema), controller.updateQty);
router.delete('/item/:itemId', requireAuth, controller.removeItem);
router.delete('/', requireAuth, controller.clearCart);
router.post('/merge', requireAuth, validate(mergeSchema), controller.mergeCart);
router.post('/sync', requireAuth, validate(syncSchema), controller.syncCart);

export default router;