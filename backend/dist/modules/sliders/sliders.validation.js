"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSlidersQuerySchema = void 0;
const zod_1 = require("zod");
/* GET /api/sliders */
exports.listSlidersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().default(''),
});
//# sourceMappingURL=sliders.validation.js.map