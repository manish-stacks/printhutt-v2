import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import * as service from './cart.service';
import type {
  AddToSessionCartDTO,
  BulkDeleteDTO,
  ListCartQueryDTO,
} from './cart.validation';

/* POST /api/cart */
export const addToSessionCart = asyncHandler(async (req: Request, res: Response) => {
  await service.addToSessionCart((req.body as AddToSessionCartDTO).product_id);
  return sendCreated(res, { message: 'Product added to cart' });
});

/* GET /api/cart — paginated admin list */
export const listCart = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListCartQueryDTO;
  const result = await service.listPaginated(q.page, q.limit);
  return res.json(result);
});

/* POST /api/cart/bulk-delete */
export const bulkDelete = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkDeleteDTO;
  const result = await service.bulkDelete(ids);
  return sendOk(res, {
    message: `${result.deletedCount} item(s) deleted successfully`,
    deletedCount: result.deletedCount,
  });
});