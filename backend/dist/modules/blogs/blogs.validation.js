"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchBlogSchema = exports.listBlogsQuerySchema = void 0;
const zod_1 = require("zod");
exports.listBlogsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().default(''),
});
exports.patchBlogSchema = zod_1.z.object({
    status: zod_1.z.union([zod_1.z.string(), zod_1.z.boolean()]),
});
//# sourceMappingURL=blogs.validation.js.map