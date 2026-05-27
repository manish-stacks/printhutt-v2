import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendOk, sendCreated } from '@/utils/api-response';
import type { MulterFile } from '@/utils/storage';
import * as service from './categories.service';
import type {
  ListCategoriesQueryDTO,
  PatchCategoryDTO,
  StorefrontListQueryDTO,
  SubListQueryDTO,
  SlugTypeQueryDTO,
} from './categories.validation';

const pickFile = (req: Request, field = 'imageUrl'): MulterFile | undefined => {
  // upload.single sets req.file
  const single = req.file as Express.Multer.File | undefined;
  if (single && single.fieldname === field) return single;
  // upload.any / upload.fields populates req.files
  const many = (req.files as Express.Multer.File[] | undefined) ?? [];
  return many.find((f) => f.fieldname === field);
};

/* ─── Admin ──────────────────────────────────────────────────── */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.adminList(req.query as unknown as ListCategoriesQueryDTO);
  return res.json(result);
});

export const byId = asyncHandler(async (req: Request, res: Response) => {
  const category = await service.byId(param(req, 'id'));
  return res.json(category);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const file = pickFile(req);
  const body = req.body as Record<string, string>;
  const result = await service.createCategory(
    {
      name: body.name?.trim?.() ?? '',
      slug: body.slug?.trim?.() ?? '',
      description: body.description,
      metaKeywords: body.metaKeywords,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      level: body.level,
      status: body.status,
    },
    file
  );
  return sendCreated(res, result as Record<string, unknown>);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const file = pickFile(req);
  const body = req.body as Record<string, string>;
  const result = await service.updateCategory(
    param(req, 'id'),
    {
      name: body.name,
      slug: body.slug,
      description: body.description,
      metaKeywords: body.metaKeywords,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      level: body.level,
      status: body.status,
    },
    file
  );
  return sendOk(res, result as Record<string, unknown>);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteCategory(param(req, 'id'));
  return sendOk(res, result as Record<string, unknown>);
});

export const patchCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.patchCategory(param(req, 'id'), req.body as PatchCategoryDTO);
  return sendOk(res, result as Record<string, unknown>);
});

export const fetchOptions = asyncHandler(async (_req: Request, res: Response) => {
  const result = await service.fetchOptions();
  return sendOk(res, result as Record<string, unknown>);
});

/* ─── Storefront ─────────────────────────────────────────────── */
export const storefrontList = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as StorefrontListQueryDTO;
  const result = await service.storefrontList(q.limit);
  return res.json(result);
});

export const featured = asyncHandler(async (_req: Request, res: Response) => {
  const result = await service.featured();
  return res.json(result);
});

export const withSub = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as SubListQueryDTO;
  const result = await service.withSub(q.category, q.limit);
  return res.json(result);
});

export const bySlug = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as SlugTypeQueryDTO;
  const result = await service.bySlug(param(req, 'slug'), q.type);
  return res.json(result);
});
