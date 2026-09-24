import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { UnauthorizedError } from '@/utils/errors';
import * as service from './usercart.service';
import type { AddItemDTO, MergeDTO, UpdateQtyDTO } from './usercart.validation';
import { sendOk } from '@/utils/api-response';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  return res.json(await service.getCart(req.user.id));
  // return res.json({success: true, message: 'Cart retrieved', items: []});
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  return res.json(await service.addItem(req.user.id, req.body as AddItemDTO));
  // return res.json({success: true, message: 'Added to cart', items: []});
});

export const updateQty = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { itemId, quantity } = req.body as UpdateQtyDTO;
  return res.json(await service.updateQty(req.user.id, itemId, quantity));
  // return res.json({success: true, message: 'Quantity updated', items: []});
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  return res.json(await service.removeItem(req.user.id, param(req, 'itemId')));
  // return res.json({success: true, message: 'Item removed', items: []});
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  return res.json(await service.clearCart(req.user.id));
  // return res.json({success: true, message: 'Cart cleared', items: []});
});

export const mergeCart = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  return res.json(await service.mergeCart(req.user.id, req.body as MergeDTO));
  // return res.json({success: true, message: 'Cart merged', items: []});
});
export const syncCart = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  return res.json(await service.syncCart(req.user.id, (req.body as MergeDTO).items));
  // return res.json({success: true, message: 'Cart synced', items: []});
});

export const adminListAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search } = req.query as Record<string, string>;
  const data = await service.adminListAll({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search,
  });
  return sendOk(res, data as any);
});

export const adminGetUserCart = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.adminGetUserCart(String(req.params.userId));
  return sendOk(res, data as any);
});