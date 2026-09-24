import { Request, Response } from 'express';
import { param } from '@/utils/req';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import type { MulterFile } from '@/utils/storage';
import * as service from './products.service';
import type {
  AdminListQueryDTO,
  ByCategoryQueryDTO,
  ImageDeleteDTO,
  NewArrivalsQueryDTO,
  OffersQueryDTO,
  PatchStatusDTO,
  RelatedQueryDTO,
  StorefrontCategoryQueryDTO,
  StorefrontListQueryDTO,
  StorefrontSubCategoryQueryDTO,
  SuggestQueryDTO,
} from './products.validation';

/* Splits req.files (upload.any) into thumbnail / images / variant-keyed map */
const splitFiles = (
  req: Request
): {
  thumbnail: MulterFile | undefined;
  galleryImages: MulterFile[];
  variantFiles: Record<string, MulterFile>;
} => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const thumbnail = files.find((f) => f.fieldname === 'thumbnail');
  const galleryImages = files.filter((f) => f.fieldname === 'images');
  const variantFiles: Record<string, MulterFile> = {};
  for (const f of files) {
    if (
      f.fieldname.startsWith('variant_thumbnail_') ||
      f.fieldname.startsWith('variant_image_')
    ) {
      variantFiles[f.fieldname] = f;
    }
  }
  return { thumbnail, galleryImages, variantFiles };
};

/* ─── Admin ─────────────────────────────────────────────────── */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.adminList(req.query as unknown as AdminListQueryDTO);
  return res.json(result);
});

export const byIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.byId(param(req, 'id'));
  return sendOk(res, { data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { thumbnail, galleryImages, variantFiles } = splitFiles(req);
  const result = await service.createProduct(
    req.body as Record<string, string>,
    thumbnail,
    galleryImages,
    variantFiles
  );
  return sendCreated(res, result as Record<string, unknown>);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { thumbnail, galleryImages, variantFiles } = splitFiles(req);
  const result = await service.updateProduct(
    param(req, 'id'),
    req.body as Record<string, string>,
    thumbnail,
    galleryImages,
    variantFiles
  );
  return sendOk(res, result as Record<string, unknown>);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteProduct(param(req, 'id'));
  return sendOk(res, result as Record<string, unknown>);
});

export const patchStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.patchStatus(
    param(req, 'id'),
    (req.body as PatchStatusDTO).status
  );
  return sendOk(res, result as Record<string, unknown>);
});

export const copyProduct = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.copyProduct(param(req, 'id'));
  return sendCreated(res, result as Record<string, unknown>);
});

export const byCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.byCategory(req.query as unknown as ByCategoryQueryDTO);
  return res.json(result);
});

export const deleteSingleImage = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteSingleImage(req.body as ImageDeleteDTO);
  return sendOk(res, result as Record<string, unknown>);
});

/* ─── Storefront ────────────────────────────────────────────── */
export const storefrontList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.storefrontList(
    req.query as unknown as StorefrontListQueryDTO
  );
  return res.json(result);
});

export const storefrontById = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.byIdStorefront(param(req, 'id'));
  return res.json(product);
});

export const storefrontBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.bySlugStorefront(param(req, 'slug'));
  return res.json(product);
});

export const storefrontByCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.storefrontByCategorySlug(
    req.query as unknown as StorefrontCategoryQueryDTO
  );
  return res.json(result);
});

export const storefrontBySubCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.storefrontBySubCategorySlug(
    req.query as unknown as StorefrontSubCategoryQueryDTO
  );
  return res.json(result);
});

export const newArrivals = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.newArrivals(req.query as unknown as NewArrivalsQueryDTO);
  return res.json(result);
});

export const withOffers = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.withOffers(req.query as unknown as OffersQueryDTO);
  return res.json(result);
});

export const suggest = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.suggest(req.query as unknown as SuggestQueryDTO);
  return res.json(result);
});

export const topRelated = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.topRelated(req.query as unknown as RelatedQueryDTO);
  return res.json(result);
});
