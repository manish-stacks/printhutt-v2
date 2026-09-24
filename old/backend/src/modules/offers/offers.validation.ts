import { z } from 'zod';

/* GET /api/offers (admin paginated) */
export const listOffersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListOffersQueryDTO = z.infer<typeof listOffersQuerySchema>;

/* POST /api/offers */
export const createOfferSchema = z.object({
  offerTitle: z.string().min(1),
  offerDescription: z.string().optional(),
  discountPercentage: z.coerce.number().optional(),
  validFrom: z.union([z.string(), z.date()]).optional(),
  validTo: z.union([z.string(), z.date()]).optional(),
});
export type CreateOfferDTO = z.infer<typeof createOfferSchema>;

/* PUT /api/offers/:id */
export const updateOfferSchema = createOfferSchema.partial();
export type UpdateOfferDTO = z.infer<typeof updateOfferSchema>;
