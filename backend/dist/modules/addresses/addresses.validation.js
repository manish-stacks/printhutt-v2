"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressUpdateSchema = exports.addressSchema = void 0;
const zod_1 = require("zod");
/* ─────────── POST /api/addresses ─────────── */
/* Ported verbatim from src/lib/types/address.ts → addressSchema */
exports.addressSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, 'Name is required'),
    mobileNumber: zod_1.z.string().min(10, 'Valid mobile number required'),
    addressLine: zod_1.z.string().min(1, 'Address is required'),
    city: zod_1.z.string().min(1, 'City is required'),
    postCode: zod_1.z.string().min(6, 'Valid post code required'),
    state: zod_1.z.string().min(1, 'State is required'),
    alternatePhone: zod_1.z.string().optional(),
    addressType: zod_1.z.enum(['home', 'work']),
    email: zod_1.z.string().email().optional(),
});
/* ─────────── PUT /api/addresses/:id ─────────── */
/* PUT accepts a partial — the original endpoint did `{ $set: validatedData }`
   on whatever JSON came in. We type it loosely but constrain known keys. */
exports.addressUpdateSchema = exports.addressSchema
    .partial()
    .extend({ isDefault: zod_1.z.boolean().optional() });
//# sourceMappingURL=addresses.validation.js.map