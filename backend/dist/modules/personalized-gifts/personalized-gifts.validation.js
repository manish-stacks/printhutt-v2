"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listQuerySchema = void 0;
const zod_1 = require("zod");
exports.listQuerySchema = zod_1.z.object({
    sectionType: zod_1.z.string().default('all'),
});
//# sourceMappingURL=personalized-gifts.validation.js.map