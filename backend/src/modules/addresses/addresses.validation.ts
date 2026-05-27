import { z } from 'zod';

/* ─────────── POST /api/addresses ─────────── */
/* Ported verbatim from src/lib/types/address.ts → addressSchema */
export const addressSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  mobileNumber: z.string().min(10, 'Valid mobile number required'),
  addressLine: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postCode: z.string().min(6, 'Valid post code required'),
  state: z.string().min(1, 'State is required'),
  alternatePhone: z.string().optional(),
  addressType: z.enum(['home', 'work']),
  email: z.string().email().optional(),
});
export type AddressDTO = z.infer<typeof addressSchema>;

/* ─────────── PUT /api/addresses/:id ─────────── */
/* PUT accepts a partial — the original endpoint did `{ $set: validatedData }`
   on whatever JSON came in. We type it loosely but constrain known keys. */
export const addressUpdateSchema = addressSchema
  .partial()
  .extend({ isDefault: z.boolean().optional() });
export type AddressUpdateDTO = z.infer<typeof addressUpdateSchema>;
