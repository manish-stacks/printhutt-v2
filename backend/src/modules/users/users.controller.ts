import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { sendOk } from '@/utils/api-response';
import { UnauthorizedError } from '@/utils/errors';
import * as service from './users.service';
import type { ListUsersQueryDTO, UpdateProfileDTO } from './users.validation';

/* GET /api/users — admin list */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.adminList(req.query as unknown as ListUsersQueryDTO);
  // Original response did NOT wrap in { success, data } — preserve shape.
  return res.json(result);
});

/* GET /api/users/me — user dashboard counts */
export const userDashboard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const data = await service.userDashboard(req.user.id);
  return sendOk(res, { data });
});

/* POST /api/users/me/profile — update profile */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const user = await service.updateProfile(req.user.id, req.body as UpdateProfileDTO);
  return sendOk(res, { message: 'User updated successfully', user });
});
