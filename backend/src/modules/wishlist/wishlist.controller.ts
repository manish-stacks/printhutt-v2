import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import { UnauthorizedError } from '@/utils/errors';
import * as service from './wishlist.service';
import type { AddToWishlistDTO } from './wishlist.validation';

/* POST /api/wishlist */
export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { alreadyExists } = await service.addToWishlist(
    req.user.id,
    (req.body as AddToWishlistDTO).productId
  );
  if (alreadyExists) {
    return sendOk(res, { message: 'Product already in wishlist' });
  }
  return sendCreated(res, { message: 'Product added to wishlist' });
});

/* GET /api/wishlist  — soft 200 even when anonymous (matches original) */
export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getWishlist(req.user?.id ?? null);
  if (!result.loggedIn) {
    return sendOk(res, {
      success: false,
      message: 'Not logged in',
      data: [],
    });
  }
  return sendOk(res, { message: 'Data fetched successfully', data: result.data });
});

/* DELETE /api/wishlist/:id  — removes a single product */
export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  await service.removeFromWishlist(req.user.id, param(req, 'id'));
  return sendOk(res, { message: 'Wishlist item removed' });
});
