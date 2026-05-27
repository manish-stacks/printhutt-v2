import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import { UnauthorizedError } from '@/utils/errors';
import * as service from './addresses.service';
import type { AddressDTO, AddressUpdateDTO } from './addresses.validation';

/* GET /api/addresses */
export const listMyAddresses = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const addresses = await service.listMyAddresses(req.user.id);
  return sendOk(res, { addresses });
});

/* POST /api/addresses */
export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const address = await service.createAddress(req.user.id, req.body as AddressDTO);
  return sendCreated(res, { message: 'Address saved successfully', address });
});

/* PUT /api/addresses/:id */
export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const updated = await service.updateAddress(
    param(req, 'id'),
    req.body as AddressUpdateDTO
  );
  return sendOk(res, {
    message: 'Shipping address updated successfully',
    data: updated,
  });
});

/* DELETE /api/addresses/:id */
export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteAddress(param(req, 'id'));
  return sendOk(res, { message: 'Address deleted successfully' });
});
