import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import type { MulterFile } from '@/utils/storage';
import * as service from './blogs.service';
import type { ListBlogsQueryDTO, PatchBlogDTO } from './blogs.validation';

const pickFile = (req: Request, field: string): MulterFile | undefined => {
  const single = req.file as Express.Multer.File | undefined;
  if (single && single.fieldname === field) return single;
  const many = (req.files as Express.Multer.File[] | undefined) ?? [];
  return many.find((f) => f.fieldname === field);
};

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.adminList(req.query as unknown as ListBlogsQueryDTO);
  return sendOk(res, result as Record<string, unknown>);
});

export const byId = asyncHandler(async (req: Request, res: Response) => {
  const blog = await service.byId(param(req, 'id'));
  return res.json(blog);
});

export const createBlog = asyncHandler(async (req: Request, res: Response) => {
  const file = pickFile(req, 'imageUrl');
  const blog = await service.createBlog(req.body as Record<string, string>, file);
  return sendCreated(res, { message: 'Blog created successfully', data: blog });
});

export const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const file = pickFile(req, 'imageUrl');
  const blog = await service.updateBlog(
    param(req, 'id'),
    req.body as Record<string, string>,
    file
  );
  return sendOk(res, { message: 'Blog updated successfully', data: blog });
});

export const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteBlog(param(req, 'id'));
  return sendOk(res, { message: 'Blog deleted successfully' });
});

export const patchBlog = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.patchBlog(param(req, 'id'), req.body as PatchBlogDTO);
  return sendOk(res, { message: 'Blog status updated successfully', data: result });
});

export const storefrontList = asyncHandler(async (_req: Request, res: Response) => {
  const result = await service.storefrontList();
  return res.json(result);
});

export const bySlug = asyncHandler(async (req: Request, res: Response) => {
  const blog = await service.bySlug(param(req, 'slug'));
  return res.json(blog);
});
