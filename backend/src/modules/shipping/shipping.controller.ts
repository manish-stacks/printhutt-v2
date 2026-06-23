import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import * as service from './shipping.service';
import type {
  CreateShipmentDTO,
  ListQueryDTO,
  UpsertDTO,
} from './shipping.validation';

/* ─── Admin CRUD ─── */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const r = await service.adminList(req.query as unknown as ListQueryDTO);
  return res.json(r);
});
export const byId = asyncHandler(async (req: Request, res: Response) => {
  const s = await service.byId(param(req, 'id'));
  return res.json(s);
});
export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.create(req.body as UpsertDTO);
  return sendCreated(res, { message: 'Data inserted successfully', data });
});
export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.update(param(req, 'id'), req.body as Partial<UpsertDTO>);
  return sendOk(res, { message: 'Shipping updated successfully', data });
});
export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.remove(param(req, 'id'));
  return sendOk(res, { message: 'Shipping deleted successfully' });
});
export const options = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.options();
  return sendOk(res, { message: 'Data fetched successfully', data });
});

/* ─── Unified shipment ops ─── */
export const createShipment = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createShipment(req.body as CreateShipmentDTO);
  return sendCreated(res, data as Record<string, unknown>);
});

export const cancelShipment = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.cancelShipment(param(req, 'orderId'));
  return sendOk(res, data as Record<string, unknown>);
});

export const track = asyncHandler(async (req: Request, res: Response) => {
  const provider = param(req, 'provider') as 'fship' | 'shiprocket' | 'velocity';
  const waybill = param(req, 'waybill');
  const data = await service.track(provider, waybill);
  return res.json(data);
});

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const provider = param(req, 'provider') as 'fship' | 'shiprocket' | 'velocity';
  const data = await service.handleWebhook(provider, req.body as Record<string, unknown>);
  return res.json(data);
});

/* ─── Legacy aliases (backward compat) ─── */
export const fshipTrack = asyncHandler(async (req: Request, res: Response) => {
  const waybill = String(
    (req.body as { waybill?: string }).waybill ??
      (req.query as { waybill?: string }).waybill ??
      ''
  );
  const data = await service.fshipTrack(waybill);
  return res.json(data);
});
export const shiprocketTrack = asyncHandler(async (req: Request, res: Response) => {
  const awb = String(
    (req.params as { awb?: string }).awb ?? (req.query as { awb?: string }).awb ?? ''
  );
  const data = await service.shiprocketTrack(awb);
  return res.json(data);
});