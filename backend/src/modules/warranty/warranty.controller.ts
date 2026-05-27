import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import * as service from './warranty.service';
import type { ListQueryDTO, PatchDTO, UpsertDTO } from './warranty.validation';

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.adminList(req.query as unknown as ListQueryDTO);
  return res.json(result);
});
export const byId = asyncHandler(async (req: Request, res: Response) => {
  const w = await service.byId(param(req, 'id'));
  return res.json(w);
});
export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createWarranty(req.body as UpsertDTO);
  return sendCreated(res, { message: 'Data inserted successfully', data });
});
export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateWarranty(param(req, 'id'), req.body as Partial<UpsertDTO>);
  return sendOk(res, { message: 'Warranty updated successfully', data });
});
export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteWarranty(param(req, 'id'));
  return sendOk(res, { message: 'Warranty deleted successfully!' });
});
export const patchStatus = asyncHandler(async (req: Request, res: Response) => {
  await service.patchStatus(param(req, 'id'), req.body as PatchDTO);
  return sendOk(res, { message: 'Successfully updated Warranty' });
});
export const options = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.options();
  return sendOk(res, { message: 'Data fetched successfully', data });
});
