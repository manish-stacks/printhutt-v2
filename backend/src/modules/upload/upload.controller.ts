import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { sendOk } from '@/utils/api-response';
import * as service from './upload.service';

export const getSignedUrl = asyncHandler(async (req: Request, res: Response) => {
  const public_id = String((req.query as { public_id?: string }).public_id ?? '');
  const url = await service.getSignedUrl(public_id);
  return sendOk(res, { message: 'success', url });
});
