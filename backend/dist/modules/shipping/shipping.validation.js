"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertSchema = exports.listQuerySchema = void 0;
const zod_1 = require("zod");
exports.listQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().default(''),
});
exports.upsertSchema = zod_1.z.object({
    shippingType: zod_1.z.string().min(1),
    deliveryDays: zod_1.z.string().min(1),
}).passthrough();
//# sourceMappingURL=shipping.validation.js.map