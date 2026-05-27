import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import * as service from './blog-categories.service';
import type { ListQueryDTO } from './blog-categories.validation';

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.adminList(req.query as unknown as ListQueryDTO);
  return res.json(result);
});

export const createBlogCategory = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Record<string, string>;
  const data = await service.createBlogCategory(body.name ?? '', body.isActive === 'true');
  return sendCreated(res, { message: 'Data inserted successfully', data });
});

export const updateBlogCategory = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Record<string, string>;
  await service.updateBlogCategory(param(req, 'id'), body.name, body.isActive);
  return sendOk(res, { message: 'Blog category updated successfully' });
});

export const deleteBlogCategory = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteBlogCategory(param(req, 'id'));
  return sendOk(res, { message: 'Blog category deleted successfully' });
});
