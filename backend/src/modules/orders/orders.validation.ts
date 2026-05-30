import { z } from 'zod';

/* ─────────── GET /api/orders ─────────── */
export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
  status: z.string().default(''),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type ListOrdersQueryDTO = z.infer<typeof listOrdersQuerySchema>;

/* ─────────── POST /api/orders  (create) ─────────── */
const orderItemSchema = z
  .object({
    productId: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().optional(),
    quantity: z.number().int().positive(),
    sku: z.string().optional(),
    product_image: z.unknown().optional(),
    price: z.number().nonnegative(),
    discountType: z.string().optional(),
    discountPrice: z.number().optional(),
    custom_data: z.unknown().optional(),
  })
  .passthrough();

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'No items in the order.'),
  address: z
    .object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      number: z.union([z.string(), z.number()]),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      postCode: z.union([z.string(), z.number()]),
      addressType: z.string().optional(),
    })
    .passthrough(),
  totalPrice: z
    .object({
      totalPrice: z.number(),
      discountPrice: z.number(),
      shippingTotal: z.number(),
      coupon_discount: z.number().optional(),
    })
    .passthrough(),
  payAmt: z.union([z.string(), z.number()]),
  paymentMethod: z.string().min(1),
  paymentPartner: z.string().optional(),
  coupon: z
    .object({
      code: z.string().optional(),
      discountAmount: z.number().optional(),
      discountType: z.string().optional(),
      isApplied: z.boolean().optional(),
    })
    .optional(),
  getTotalItems: z.number().optional(),
});
export type CreateOrderDTO = z.infer<typeof createOrderSchema>;

/* ─────────── PATCH /api/orders/:id/status ─────────── */
export const updateOrderStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  refundReason: z.string().optional(),
});
export type UpdateOrderStatusDTO = z.infer<typeof updateOrderStatusSchema>;

/* ─────────── PATCH /api/orders/:id/shipping ─────────── */
export const updateOrderShippingSchema = z.object({
  shipping: z
    .object({
      userName: z.string().optional(),
      mobileNumber: z.union([z.string(), z.number()]).optional(),
      email: z.string().optional(),
      addressLine: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postCode: z.union([z.string(), z.number()]).optional(),
    })
    .passthrough(),
});
export type UpdateOrderShippingDTO = z.infer<typeof updateOrderShippingSchema>;

export const bulkDeleteOrdersSchema = z.object({
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: 'Invalid startDate (expected ISO date string)',
  }),
  endDate: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: 'Invalid endDate (expected ISO date string)',
  }),
  // Optional safety: require admin to confirm count first
  confirmCount: z.number().int().nonnegative().optional(),
}).refine(
  (d) => new Date(d.startDate) <= new Date(d.endDate),
  { message: 'startDate must be before endDate' }
);

export type BulkDeleteOrdersDTO = z.infer<typeof bulkDeleteOrdersSchema>;