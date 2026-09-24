import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendOk } from '@/utils/api-response';
import type { MulterFile } from '@/utils/storage';
import * as service from './personalized-gifts.service';
import type { ListQueryDTO } from './personalized-gifts.validation';

const pickFile = (req: Request, field: string): MulterFile | undefined => {
  const single = req.file as Express.Multer.File | undefined;
  if (single && single.fieldname === field) return single;
  const many = (req.files as Express.Multer.File[] | undefined) ?? [];
  return many.find((f) => f.fieldname === field);
};

export const storefrontList = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListQueryDTO;
  const data = await service.storefrontList(q.sectionType);
  return sendOk(res, { data });
});

export const createGift = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createGift(req.body as Record<string, string>, pickFile(req, 'media'));
  return sendOk(res, { message: 'Created Successfully', data });
});

export const updateGift = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateGift(
    param(req, 'id'),
    req.body as Record<string, string>,
    pickFile(req, 'media')
  );
  return sendOk(res, { message: 'Updated Successfully', data });
});

export const deleteGift = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteGift(param(req, 'id'));
  return sendOk(res, { message: 'Deleted Successfully' });
});
