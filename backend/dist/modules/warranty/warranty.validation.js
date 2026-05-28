"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchSchema = exports.upsertSchema = exports.listQuerySchema = void 0;
const zod_1 = require("zod");
exports.listQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().default(''),
});
exports.upsertSchema = zod_1.z.object({
    warrantyType: zod_1.z.string().min(1),
    durationMonths: zod_1.z.coerce.number(),
    coverage: zod_1.z.string().min(1),
    claimProcess: zod_1.z.string().min(1),
});
exports.patchSchema = zod_1.z.object({ status: zod_1.z.union([zod_1.z.string(), zod_1.z.boolean()]) });
//# sourceMappingURL=warranty.validation.js.map