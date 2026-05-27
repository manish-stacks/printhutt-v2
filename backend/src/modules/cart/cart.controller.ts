import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import * as service from './cart.service';
import type { AddToSessionCartDTO } from './cart.validation';

/* POST /api/cart */
export const addToSessionCart = asyncHandler(async (req: Request, res: Response) => {
  await service.addToSessionCart((req.body as AddToSessionCartDTO).product_id);
  return sendCreated(res, { message: 'Product added to cart' });
});

/* GET /api/cart */
export const recentSessionCart = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.recentSessionCart();
  if (data.length === 0) return res.status(204).end();
  return sendOk(res, { message: 'Cart retrieved successfully', data });
});
