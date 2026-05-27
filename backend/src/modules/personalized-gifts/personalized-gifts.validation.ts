import { z } from 'zod';
export const listQuerySchema = z.object({
  sectionType: z.string().default('all'),
});
export type ListQueryDTO = z.infer<typeof listQuerySchema>;
