import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendOk } from '@/utils/api-response';
import type { MulterFile } from '@/utils/storage';
import * as service from './settings.service';
import type { BulkUpsertDTO, SingleUpsertDTO } from './settings.validation';

const pickFile = (req: Request, field = 'image'): MulterFile | undefined => {
  const single = req.file as Express.Multer.File | undefined;
  if (single && single.fieldname === field) return single;
  const many = (req.files as Express.Multer.File[] | undefined) ?? [];
  return many.find((f) => f.fieldname === field);
};

/* Public — flat { key: value } map */
export const publicMap = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.publicMap();
  return res.json({ success: true, settings: data });
});

/* Admin — full list with type/group/label */
export const adminAll = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.adminAll();
  return sendOk(res, { data });
});

export const byKey = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.byKey(param(req, 'key'));
  return res.json(data);
});

export const bulkUpsert = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.bulkUpsert(req.body as BulkUpsertDTO);
  return sendOk(res, { message: 'Settings updated', data });
});

export const singleUpsert = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.singleUpsert(req.body as SingleUpsertDTO);
  return sendOk(res, { message: 'Setting updated', data });
});

export const uploadImageSetting = asyncHandler(async (req: Request, res: Response) => {
  const file = pickFile(req, 'image');
  const body = req.body as { key: string; group?: string };
  const data = await service.uploadImageSetting(body.key, file, body.group);
  return sendOk(res, { message: 'Image uploaded', data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.remove(param(req, 'key'));
  return sendOk(res, { message: 'Setting deleted' });
});