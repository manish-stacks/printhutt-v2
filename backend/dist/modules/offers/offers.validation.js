"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOfferSchema = exports.createOfferSchema = exports.listOffersQuerySchema = void 0;
const zod_1 = require("zod");
/* GET /api/offers (admin paginated) */
exports.listOffersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().default(''),
});
/* POST /api/offers */
exports.createOfferSchema = zod_1.z.object({
    offerTitle: zod_1.z.string().min(1),
    offerDescription: zod_1.z.string().optional(),
    discountPercentage: zod_1.z.coerce.number().optional(),
    validFrom: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional(),
    validTo: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional(),
});
/* PUT /api/offers/:id */
exports.updateOfferSchema = exports.createOfferSchema.partial();
//# sourceMappingURL=offers.validation.js.map