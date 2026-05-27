import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import * as service from './dashboard.service';

export const overview = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.overview();
  return res.json(data);
});
