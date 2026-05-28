"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.byId = byId;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.options = options;
/** Return-policy service. Ports src/app/api/return-policy/* */
const errors_1 = require("@/utils/errors");
const return_policy_repository_1 = require("./return-policy.repository");
async function adminList(q) {
    const { returndata, total } = await return_policy_repository_1.returnPolicyRepo.adminList(q.page, q.limit, q.search);
    return { returndata, pagination: { total, pages: Math.ceil(total / q.limit), page: q.page, limit: q.limit } };
}
async function byId(id) {
    if (!return_policy_repository_1.returnPolicyRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Return Policy ID');
    const p = await return_policy_repository_1.returnPolicyRepo.findById(id);
    if (!p)
        throw new errors_1.NotFoundError('Return Policy not found');
    return p;
}
async function create(body) {
    return return_policy_repository_1.returnPolicyRepo.create({ ...body });
}
async function update(id, patch) {
    if (!return_policy_repository_1.returnPolicyRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Return Policy ID');
    const updated = await return_policy_repository_1.returnPolicyRepo.updateById(id, patch);
    if (!updated)
        throw new errors_1.NotFoundError('Return Policy not found');
    return updated;
}
async function remove(id) {
    if (!return_policy_repository_1.returnPolicyRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Return Policy ID');
    const d = await return_policy_repository_1.returnPolicyRepo.deleteById(id);
    if (!d)
        throw new errors_1.NotFoundError('Return Policy not found');
}
async function options() {
    return return_policy_repository_1.returnPolicyRepo.options();
}
//# sourceMappingURL=return-policy.service.js.map