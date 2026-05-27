import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import type { MulterFile } from '@/utils/storage';
import * as service from './sliders.service';
import type { ListSlidersQueryDTO } from './sliders.validation';

const pickFile = (req: Request, field: string): MulterFile | undefined => {
  const single = req.file as Express.Multer.File | undefined;
  if (single && single.fieldname === field) return single;
  const many = (req.files as Express.Multer.File[] | undefined) ?? [];
  return many.find((f) => f.fieldname === field);
};

/* GET /api/sliders  (admin) */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.adminList(req.query as unknown as ListSlidersQueryDTO);
  return res.json(result);
});

/* POST /api/sliders  (multipart, field name 'slider') */
export const createSlider = asyncHandler(async (req: Request, res: Response) => {
  const file = pickFile(req, 'slider');
  const body = req.body as Record<string, string>;
  const slider = await service.createSlider(
    {
      title: body.title,
      link: body.link,
      isActive: body.isActive,
      level: body.level,
    },
    file
  );
  return sendCreated(res, { message: 'Slider created successfully', data: slider });
});

/* PUT /api/sliders/:id  (multipart) */
export const updateSlider = asyncHandler(async (req: Request, res: Response) => {
  const file = pickFile(req, 'slider');
  const body = req.body as Record<string, string>;
  await service.updateSlider(
    param(req, 'id'),
    {
      title: body.title,
      link: body.link,
      isActive: body.isActive,
      level: body.level,
    },
    file
  );
  return sendOk(res, { message: 'Slider updated successfully' });
});

/* DELETE /api/sliders/:id */
export const deleteSlider = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteSlider(param(req, 'id'));
  return sendOk(res, { message: 'Slider deleted successfully' });
});

/* GET /api/sliders/storefront  (active only) */
export const storefrontActive = asyncHandler(async (_req: Request, res: Response) => {
  const result = await service.storefrontActive();
  return res.json(result);
});
