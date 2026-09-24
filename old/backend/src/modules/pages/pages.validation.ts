import { z } from 'zod';

export const PAGE_SLUGS = [
  'return-policy',
  'privacy-policy',
  'terms-and-conditions',
  'refund-policy',
] as const;

export const slugParamSchema = z.object({
  slug: z.enum(PAGE_SLUGS),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
});
export type UpdatePageDTO = z.infer<typeof updatePageSchema>;