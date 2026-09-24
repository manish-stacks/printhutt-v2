import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import * as service from './offers.service';
import type {
  CreateOfferDTO,
  ListOffersQueryDTO,
  UpdateOfferDTO,
} from './offers.validation';

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.adminList(req.query as unknown as ListOffersQueryDTO);
  return sendOk(res, result as Record<string, unknown>);
});

export const byId = asyncHandler(async (req: Request, res: Response) => {
  const offer = await service.byId(param(req, 'id'));
  return sendOk(res, { data: offer });
});

export const createOffer = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createOffer(req.body as CreateOfferDTO);
  return sendCreated(res, { message: 'Data inserted successfully', data });
});

export const updateOffer = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateOffer(param(req, 'id'), req.body as UpdateOfferDTO);
  return sendOk(res, { message: 'Offer updated successfully', data });
});

export const deleteOffer = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteOffer(param(req, 'id'));
  return sendOk(res, { message: 'Offer deleted successfully' });
});

export const fetchOptions = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.fetchOptions();
  return sendOk(res, { message: 'Data fetched successfully', data });
});
