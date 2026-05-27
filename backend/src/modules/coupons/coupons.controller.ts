import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import { UnauthorizedError } from '@/utils/errors';
import * as service from './coupons.service';
import type {
  ApplyCouponDTO,
  CreateCouponDTO,
  ListCouponsQueryDTO,
  UpdateCouponDTO,
} from './coupons.validation';

/* GET /api/coupons */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.adminList(req.query as unknown as ListCouponsQueryDTO);
  return sendOk(res, result as Record<string, unknown>);
});

/* GET /api/coupons/:id */
export const byId = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await service.byId(param(req, 'id'));
  return res.json(coupon);
});

/* POST /api/coupons */
export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await service.createCoupon(req.body as CreateCouponDTO);
  return sendCreated(res, { message: 'Coupon created successfully', data: coupon });
});

/* PUT /api/coupons/:id */
export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const updated = await service.updateCoupon(param(req, 'id'), req.body as UpdateCouponDTO);
  return sendOk(res, { message: 'Coupon updated successfully', data: updated });
});

/* DELETE /api/coupons/:id */
export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteCoupon(param(req, 'id'));
  return sendOk(res, { message: 'Coupon deleted successfully!' });
});

/* GET /api/coupons/storefront — active + visible */
export const storefrontActive = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await service.storefrontActive();
  return sendOk(res, { coupons });
});

/* POST /api/coupons/apply — check user.couponCollection */
export const applyCheck = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('Unauthorized User');
  const body = req.body as ApplyCouponDTO;
  const { alreadyUsed } = await service.applyCheck(req.user.id, body.coupon.id);
  if (alreadyUsed) {
    return sendOk(res, { message: 'Coupon already used.' });
  }
  return sendOk(res, { message: 'Coupon available' });
});
