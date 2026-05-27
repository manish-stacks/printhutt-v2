import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import * as service from './shipping.service';
import type { ListQueryDTO, UpsertDTO } from './shipping.validation';

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

export const fshipTrack = asyncHandler(async (req: Request, res: Response) => {
  const waybill = String((req.body as { waybill?: string }).waybill ?? (req.query as { waybill?: string }).waybill ?? '');
  const data = await service.fshipTrack(waybill);
  return res.json(data);
});
export const shiprocketTrack = asyncHandler(async (req: Request, res: Response) => {
  const awb = String((req.params as { awb?: string }).awb ?? (req.query as { awb?: string }).awb ?? '');
  const data = await service.shiprocketTrack(awb);
  return res.json(data);
});
export const shiprocketCreateOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.shiprocketCreateOrder(req.body);
  return res.json(data);
});
export const shiprocketWebhook = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.shiprocketWebhook(req.body);
  return res.json(data);
});
