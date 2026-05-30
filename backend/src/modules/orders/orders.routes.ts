import { Router } from 'express';
import { requireAdmin, requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './orders.controller';
import {
  bulkDeleteOrdersSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderShippingSchema,
  updateOrderStatusSchema,
} from './orders.validation';

const router = Router();

/* Original: GET /api/order   (admin sees non-pending unless filtered;
   regular users see only their own orders) */
router.get(
  '/',
  requireAuth,
  validate(listOrdersQuerySchema, 'query'),
  controller.list
);

/* Original: POST /api/order */
router.post(
  '/',
  requireAuth,
  validate(createOrderSchema),
  controller.createOrder
);

/* Original: PATCH /api/order/[id]/shipping */
router.patch(
  '/:id/shipping',
  requireAuth,
  validate(updateOrderShippingSchema),
  controller.updateShipping
);

/* Original: PATCH /api/order/[id]/status   (admin-only side-effects) */
router.patch(
  '/:id/status',
  requireAuth,
  validate(updateOrderStatusSchema),
  controller.updateStatus
);

/* Original: GET /api/order/[id]/pending  (pending-nav variant) */
router.get('/:id/pending', requireAuth, controller.byIdPending);

/* Original: DELETE /api/order/[id]/pending */
router.delete('/:id/pending', requireAuth, controller.deleteOrder);

/* Original: GET /api/order/[id] */
router.get('/:id', requireAuth, controller.byId);

/* Original: DELETE /api/order/[id] */
router.delete('/:id', requireAuth, controller.deleteOrder);



// Preview — kitne delete honge
router.get(
  '/bulk-delete/preview',
  ...requireAdmin,
  controller.previewBulkDelete
);

// Actual bulk delete
router.post(
  '/bulk-delete',
  ...requireAdmin,
  validate(bulkDeleteOrdersSchema),
  controller.bulkDeletePendingOrders
);

export default router;
