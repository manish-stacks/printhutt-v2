import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import { UnauthorizedError } from '@/utils/errors';
import type { MulterFile } from '@/utils/storage';
import * as service from './reviews.service';
import type { ListReviewsQueryDTO } from './reviews.validation';

/* GET /api/reviews — admin paginated */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.adminList(req.query as unknown as ListReviewsQueryDTO);
  return sendOk(res, result as Record<string, unknown>);
});

/* POST /api/reviews — multipart (images[]) */
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const body = req.body as Record<string, string>;
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const images = files.filter((f) => f.fieldname === 'images') as MulterFile[];
  const result = await service.createReview(
    req.user.id,
    {
      orderId: body.orderId,
      rating: body.rating,
      review: body.review,
      productId: body.productId,
    },
    images
  );
  return sendCreated(res, { message: 'Data inserted successfully', review: result });
});

/* DELETE /api/reviews/:id — admin */
export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteReview(param(req, 'id'));
  return sendOk(res, { message: 'Review deleted successfully' });
});
