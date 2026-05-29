import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendOk } from '@/utils/api-response';
import * as service from './pages.service';
import type { UpdatePageDTO } from './pages.validation';

export const getPageBySlug = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getPageBySlug(param(req, 'slug'));
  return res.json(data);
});

export const listPagesAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.listPagesAdmin();
  return res.json(data);
});

export const updatePage = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updatePage(param(req, 'slug'), req.body as UpdatePageDTO);
  return sendOk(res, data as Record<string, unknown>);
});