import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListQueryDTO = z.infer<typeof listQuerySchema>;

export const upsertSchema = z
  .object({
    shippingType: z.string().min(1),
    deliveryDays: z.string().min(1),
  })
  .passthrough();
export type UpsertDTO = z.infer<typeof upsertSchema>;

/* ─── Create shipment (FShip / Shiprocket) ─── */
export const createShipmentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  provider: z.enum(['fship', 'shiprocket']),
  shipmentDetails: z.object({
    length: z.union([z.string(), z.number()]),
    width: z.union([z.string(), z.number()]),
    height: z.union([z.string(), z.number()]),
    weight: z.union([z.string(), z.number()]),
  }),
});
export type CreateShipmentDTO = z.infer<typeof createShipmentSchema>;

/* ─── Webhook param ─── */
export const providerParamSchema = z.object({
  provider: z.enum(['fship', 'shiprocket']),
});