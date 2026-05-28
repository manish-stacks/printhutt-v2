"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReviewsQuerySchema = void 0;
const zod_1 = require("zod");
/* GET /api/reviews  (admin paginated list) */
exports.listReviewsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().default(''),
});
//# sourceMappingURL=reviews.validation.js.map