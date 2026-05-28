import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { sendOk } from '@/utils/api-response';
import { UnauthorizedError } from '@/utils/errors';
import * as service from './users.service';
import type { ListUsersQueryDTO, UpdateProfileDTO, BlockUserDTO } from './users.validation';
import { param } from '@/utils/req';

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
/* GET /api/users/:id/full — full detail for admin */
export const userFullDetail = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.userFullDetail(param(req, 'id'));
  return res.json(data);
});

/* GET /api/users/export/excel — download all users as xlsx */
export const exportUsersExcel = asyncHandler(async (req: Request, res: Response) => {
  const search = String((req.query as { search?: string }).search ?? '');
  const buffer = await service.exportUsersExcel(search);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="users-${Date.now()}.xlsx"`
  );
  return res.send(Buffer.from(buffer));
});

/* PATCH /api/users/:id/block — admin block/unblock */
export const setBlockStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.setBlockStatus(
    param(req, 'id'),
    (req.body as BlockUserDTO).isBlocked
  );
  return sendOk(res, {
    message: (req.body as BlockUserDTO).isBlocked
      ? 'User blocked successfully'
      : 'User unblocked successfully',
    user,
  });
});