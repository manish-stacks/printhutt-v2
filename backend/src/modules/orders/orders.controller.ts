import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendOk } from '@/utils/api-response';
import { UnauthorizedError } from '@/utils/errors';
import * as service from './orders.service';
import * as exportService from './orders.export.service';
import type {
  BulkDeleteOrdersDTO,
  CreateOrderDTO,
  ExportOrdersQueryDTO,
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

/* GET /orders/export/excel?status=...&paymentType=...&paymentStatus=...&startDate=...&endDate=...&search=... */
export const exportOrdersExcel = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ExportOrdersQueryDTO;
  const buffer = await exportService.exportOrdersExcel(q);

  const stamp = new Date()
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
  const statusPart = (q.status || 'all').replace(/,/g, '-');

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="orders-${statusPart}-${stamp}.xlsx"`
  );
  res.setHeader('Cache-Control', 'no-store');
  return res.send(Buffer.from(buffer));
});

/* GET /orders/bulk-delete/preview?startDate=...&endDate=... */
export const previewBulkDelete = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
  }
  const data = await service.previewBulkDelete(startDate, endDate);
  return sendOk(res, data as Record<string, unknown>);
});

/* POST /orders/bulk-delete */
export const bulkDeletePendingOrders = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.bulkDeletePendingOrders(req.body as BulkDeleteOrdersDTO);
  return sendOk(res, data as Record<string, unknown>);
});