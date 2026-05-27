import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendOk } from '@/utils/api-response';
import { UnauthorizedError } from '@/utils/errors';
import * as service from './orders.service';
import type {
  CreateOrderDTO,
  ListOrdersQueryDTO,
  UpdateOrderShippingDTO,
  UpdateOrderStatusDTO,
} from './orders.validation';

/* GET /api/orders */
export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const result = await service.list(
    { id: req.user.id, role: req.user.role },
    req.query as unknown as ListOrdersQueryDTO
  );
  return res.json(result);
});

/* GET /api/orders/:id  (default — non-pending nav) */
export const byId = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.byId(param(req, 'id'), false);
  return res.json(result);
});

/* GET /api/orders/:id/pending  (pending-only nav) */
export const byIdPending = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.byId(param(req, 'id'), true);
  return res.json(result);
});

/* DELETE /api/orders/:id  (and /api/orders/:id/pending  share same handler) */
export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteOrder(param(req, 'id'));
  return sendOk(res, result as Record<string, unknown>);
});

/* POST /api/orders */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const result = await service.createOrder(req.user.id, req.body as CreateOrderDTO);
  return res.json(result);
});

/* PATCH /api/orders/:id/shipping */
export const updateShipping = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.updateOrderShipping(
    param(req, 'id'),
    req.body as UpdateOrderShippingDTO
  );
  return sendOk(res, result as Record<string, unknown>);
});

/* PATCH /api/orders/:id/status */
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.updateOrderStatus(
    param(req, 'id'),
    req.body as UpdateOrderStatusDTO
  );
  return sendOk(res, result as Record<string, unknown>);
});
