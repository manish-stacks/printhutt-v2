"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.byId = byId;
exports.createWarranty = createWarranty;
exports.updateWarranty = updateWarranty;
exports.deleteWarranty = deleteWarranty;
exports.patchStatus = patchStatus;
exports.options = options;
/** Warranty service. Ports src/app/api/warranty/* */
const errors_1 = require("@/utils/errors");
const warranty_repository_1 = require("./warranty.repository");
async function adminList(q) {
    const { warranty, total } = await warranty_repository_1.warrantyRepo.adminList(q.page, q.limit, q.search);
    return { warranty, pagination: { total, pages: Math.ceil(total / q.limit), page: q.page, limit: q.limit } };
}
async function byId(id) {
    if (!warranty_repository_1.warrantyRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    const w = await warranty_repository_1.warrantyRepo.findById(id);
    if (!w)
        throw new errors_1.NotFoundError('Post not found');
    return w;
}
async function createWarranty(body) {
    return warranty_repository_1.warrantyRepo.create({ ...body });
}
async function updateWarranty(id, patch) {
    if (!warranty_repository_1.warrantyRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    const existing = await warranty_repository_1.warrantyRepo.findById(id);
    if (!existing)
        throw new errors_1.NotFoundError('Warranty not found');
    if (patch.warrantyType !== undefined) {
        existing.warrantyType = patch.warrantyType;
    }
    if (patch.durationMonths !== undefined)
        existing.durationMonths = patch.durationMonths;
    existing.coverage = patch.coverage || existing.coverage;
    existing.claimProcess = patch.claimProcess || existing.claimProcess;
    await existing.save();
    return existing;
}
async function deleteWarranty(id) {
    if (!warranty_repository_1.warrantyRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    const d = await warranty_repository_1.warrantyRepo.deleteById(id);
    if (!d)
        throw new errors_1.NotFoundError('Warranty not found');
}
async function patchStatus(id, body) {
    if (!warranty_repository_1.warrantyRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    const updated = await warranty_repository_1.warrantyRepo.updateById(id, { status: body.status });
    if (!updated)
        throw new errors_1.NotFoundError('Warranty not found');
    return updated;
}
async function options() {
    return warranty_repository_1.warrantyRepo.options();
}
//# sourceMappingURL=warranty.service.js.map