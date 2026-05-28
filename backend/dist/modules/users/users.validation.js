"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.listUsersQuerySchema = void 0;
const zod_1 = require("zod");
/* ─────────── GET /api/user (admin list) ─────────── */
exports.listUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().default(''),
});
/* ─────────── POST /api/v1/user/update-profile ─────────── */
exports.updateProfileSchema = zod_1.z
    .object({
    displayName: zod_1.z.string().optional(),
    number: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(6).optional(),
})
    .refine((d) => d.displayName !== undefined ||
    d.number !== undefined ||
    d.email !== undefined ||
    d.password !== undefined, { message: 'At least one field must be provided' });
//# sourceMappingURL=users.validation.js.map