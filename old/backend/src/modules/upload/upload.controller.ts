import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { sendOk } from '@/utils/api-response';
import * as service from './upload.service';

export const getSignedUrl = asyncHandler(async (req: Request, res: Response) => {
  const public_id = String((req.query as { public_id?: string }).public_id ?? '');
  const url = await service.getSignedUrl(public_id);
  return sendOk(res, { message: 'success', url });
});

/* POST /api/upload/custom-image
   multipart field 'image'  OR  json { dataUri }  → { url, public_id } */
export const uploadCustomImage = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  const dataUri = (req.body as { dataUri?: string })?.dataUri;
  const asset = await service.uploadCustomImage(
    file as unknown as undefined,
    dataUri
  );
  return sendOk(res, { message: 'uploaded', url: asset.url, public_id: asset.public_id });
});
