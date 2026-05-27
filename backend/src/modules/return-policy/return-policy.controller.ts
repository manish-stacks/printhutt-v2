import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import * as service from './return-policy.service';
import type { ListQueryDTO, UpsertDTO } from './return-policy.validation';

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const r = await service.adminList(req.query as unknown as ListQueryDTO);
  return res.json(r);
});
export const byId = asyncHandler(async (req: Request, res: Response) => {
  const p = await service.byId(param(req, 'id'));
  return res.json(p);
});
export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.create(req.body as UpsertDTO);
  return sendCreated(res, { message: 'Data inserted successfully', data });
});
export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.update(param(req, 'id'), req.body as Partial<UpsertDTO>);
  return sendOk(res, { message: 'Return policy updated successfully', data });
});
export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.remove(param(req, 'id'));
  return sendOk(res, { message: 'Return policy deleted successfully' });
});
export const options = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.options();
  return sendOk(res, { message: 'Data fetched successfully', data });
});
