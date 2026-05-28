"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyAddresses = listMyAddresses;
exports.createAddress = createAddress;
exports.updateAddress = updateAddress;
exports.deleteAddress = deleteAddress;
/**
 * Addresses service. Direct port of:
 *   src/app/api/address/route.ts          GET + POST
 *   src/app/api/address/[id]/route.ts     PUT + DELETE
 *
 * Behaviour preserved exactly. Notably, the POST handler also patches the
 * user record: it backfills the user's username (from fullName) and email
 * when those fields are missing/default — the original did this and the
 * frontend depends on it during first-time checkout.
 */
const errors_1 = require("@/utils/errors");
const addresses_repository_1 = require("./addresses.repository");
/* ──────────────── 1. List my addresses ──────────────── */
async function listMyAddresses(userId) {
    return addresses_repository_1.addressesRepo.findByUser(userId);
}
/* ──────────────── 2. Create address ──────────────── */
async function createAddress(userId, data) {
    const user = await addresses_repository_1.addressesRepo.findUserById(userId);
    if (!user)
        throw new errors_1.NotFoundError('User not found');
    // Backfill username + email (preserved from original)
    if (!user.username || user.username === 'user')
        user.username = data.fullName;
    if (!user.email && data.email)
        user.email = data.email;
    await user.save();
    // First address becomes default; if so, clear any prior defaults
    const addressCount = await addresses_repository_1.addressesRepo.countByUser(userId);
    const isDefault = addressCount === 0;
    if (isDefault)
        await addresses_repository_1.addressesRepo.clearDefaultForUser(userId);
    const address = await addresses_repository_1.addressesRepo.create({
        userId,
        fullName: data.fullName,
        mobileNumber: data.mobileNumber,
        addressLine: data.addressLine,
        city: data.city,
        state: data.state,
        postCode: data.postCode,
        addressType: data.addressType,
        alternatePhone: data.alternatePhone,
        isDefault,
        email: data.email,
    });
    return address;
}
/* ──────────────── 3. Update address ──────────────── */
async function updateAddress(id, patch) {
    if (!addresses_repository_1.addressesRepo.isValidObjectId(id)) {
        throw new errors_1.BadRequestError('Invalid Address ID');
    }
    const existing = await addresses_repository_1.addressesRepo.findById(id);
    if (!existing)
        throw new errors_1.NotFoundError('Address not found');
    return addresses_repository_1.addressesRepo.updateById(id, patch);
}
/* ──────────────── 4. Delete address ──────────────── */
async function deleteAddress(id) {
    if (!addresses_repository_1.addressesRepo.isValidObjectId(id)) {
        throw new errors_1.BadRequestError('Invalid Address ID');
    }
    const deleted = await addresses_repository_1.addressesRepo.deleteById(id);
    if (!deleted)
        throw new errors_1.NotFoundError('Address not found');
}
//# sourceMappingURL=addresses.service.js.map