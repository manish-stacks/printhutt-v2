import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import type { MulterFile } from '@/utils/storage';
import * as service from './subcategories.service';
import type {
  FetchByParentDTO,
  ListSubcategoriesQueryDTO,
  PatchSubcategoryDTO,
} from './subcategories.validation';

const pickFile = (req: Request, field = 'imageUrl'): MulterFile | undefined => {
  const single = req.file as Express.Multer.File | undefined;
  if (single && single.fieldname === field) return single;
  const many = (req.files as Express.Multer.File[] | undefined) ?? [];
  return many.find((f) => f.fieldname === field);
};

/* ─── Admin ─────────────────────────────────────────────────── */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.adminList(req.query as unknown as ListSubcategoriesQueryDTO);
  return res.json(result);
});

export const byId = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.byId(param(req, 'id'));
  return res.json(result);
});

export const createSubcategory = asyncHandler(async (req: Request, res: Response) => {
  const file = pickFile(req);
  const body = req.body as Record<string, string>;
  const result = await service.createSubcategory(
    {
      name: body.name,
      slug: body.slug,
      description: body.description,
      metaKeywords: body.metaKeywords,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      parentCategory: body.parentCategory || undefined,
      level: body.level,
      status: body.status === 'true',
    },
    file
  );
  return sendCreated(res, result as Record<string, unknown>);
});

export const updateSubcategory = asyncHandler(async (req: Request, res: Response) => {
  const file = pickFile(req);
  const body = req.body as Record<string, string>;
  const result = await service.updateSubcategory(
    param(req, 'id'),
    {
      name: body.name,
      slug: body.slug,
      description: body.description,
      metaKeywords: body.metaKeywords,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      parentCategory: body.parentCategory,
      level: body.level,
      status: body.status === undefined ? undefined : body.status === 'true',
    },
    file
  );
  return sendOk(res, result as Record<string, unknown>);
});

export const deleteSubcategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteSubcategory(param(req, 'id'));
  return sendOk(res, result as Record<string, unknown>);
});

export const patchSubcategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.patchSubcategory(param(req, 'id'), req.body as PatchSubcategoryDTO);
  return sendOk(res, result as Record<string, unknown>);
});

/* ─── Public ────────────────────────────────────────────────── */
export const fetchByParent = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.fetchByParent((req.body as FetchByParentDTO).id);
  return res.json(result);
});

export const bySlug = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.bySlug(param(req, 'slug'));
  return res.json(result);
});
