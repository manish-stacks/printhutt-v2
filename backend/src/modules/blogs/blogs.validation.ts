import { z } from 'zod';

export const listBlogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListBlogsQueryDTO = z.infer<typeof listBlogsQuerySchema>;

export const patchBlogSchema = z.object({
  status: z.union([z.string(), z.boolean()]),
});
export type PatchBlogDTO = z.infer<typeof patchBlogSchema>;
