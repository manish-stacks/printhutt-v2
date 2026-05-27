import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import type { MulterFile } from '@/utils/storage';
import * as service from './testimonials.service';
import type { ListTestimonialsQueryDTO } from './testimonials.validation';

const pickFile = (req: Request, field: string): MulterFile | undefined => {
  const single = req.file as Express.Multer.File | undefined;
  if (single && single.fieldname === field) return single;
  const many = (req.files as Express.Multer.File[] | undefined) ?? [];
  return many.find((f) => f.fieldname === field);
};

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.adminList(req.query as unknown as ListTestimonialsQueryDTO);
  return res.json(result);
});

export const createTestimonial = asyncHandler(async (req: Request, res: Response) => {
  const file = pickFile(req, 'image');
  const body = req.body as Record<string, string>;
  const data = await service.createTestimonial(
    { name: body.name, feedback: body.feedback, isActive: body.isActive },
    file
  );
  return sendCreated(res, { message: 'Testimonial created successfully', data });
});

export const updateTestimonial = asyncHandler(async (req: Request, res: Response) => {
  const file = pickFile(req, 'image');
  const body = req.body as Record<string, string>;
  await service.updateTestimonial(
    param(req, 'id'),
    { name: body.name, feedback: body.feedback, isActive: body.isActive },
    file
  );
  return sendOk(res, { message: 'Testimonial updated successfully' });
});

export const deleteTestimonial = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteTestimonial(param(req, 'id'));
  return sendOk(res, { message: 'Testimonial deleted successfully' });
});

export const storefrontRecent = asyncHandler(async (_req: Request, res: Response) => {
  const result = await service.storefrontRecent();
  return res.json(result);
});
