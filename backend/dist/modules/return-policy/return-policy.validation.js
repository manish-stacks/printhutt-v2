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
    returnPeriod: zod_1.z.string().min(1),
    restockingFee: zod_1.z.coerce.number().optional(),
    policyDetails: zod_1.z.string().min(1),
});
//# sourceMappingURL=return-policy.validation.js.map