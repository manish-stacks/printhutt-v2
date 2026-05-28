"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.byId = byId;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.options = options;
exports.fshipTrack = fshipTrack;
exports.shiprocketTrack = shiprocketTrack;
exports.shiprocketCreateOrder = shiprocketCreateOrder;
exports.shiprocketWebhook = shiprocketWebhook;
/**
 * Shipping service. Ports:
 *   src/app/api/shipping/*
 *   src/app/api/fship/track/route.ts
 *   src/app/api/shiprocket/*
 */
const axios_1 = __importDefault(require("axios"));
const errors_1 = require("@/utils/errors");
const helpers_1 = require("@/utils/helpers");
const shipping_repository_1 = require("./shipping.repository");
async function adminList(q) {
    const { shipping, total } = await shipping_repository_1.shippingRepo.adminList(q.page, q.limit, q.search);
    return { shipping, pagination: { total, pages: Math.ceil(total / q.limit), page: q.page, limit: q.limit } };
}
async function byId(id) {
    if (!shipping_repository_1.shippingRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid id');
    const s = await shipping_repository_1.shippingRepo.findById(id);
    if (!s)
        throw new errors_1.NotFoundError('Shipping not found');
    return s;
}
async function create(body) {
    return shipping_repository_1.shippingRepo.create({ ...body });
}
async function update(id, patch) {
    if (!shipping_repository_1.shippingRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid id');
    const updated = await shipping_repository_1.shippingRepo.updateById(id, patch);
    if (!updated)
        throw new errors_1.NotFoundError('Shipping not found');
    return updated;
}
async function remove(id) {
    if (!shipping_repository_1.shippingRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid id');
    const d = await shipping_repository_1.shippingRepo.deleteById(id);
    if (!d)
        throw new errors_1.NotFoundError('Shipping not found');
}
async function options() {
    return shipping_repository_1.shippingRepo.options();
}
/* ─── fship/shiprocket integration ─── */
async function fshipTrack(waybill) {
    if (!waybill)
        throw new errors_1.BadRequestError('waybill is required');
    const token = (0, helpers_1.fshipToken)();
    const { data } = await axios_1.default.post('https://capi.fship.in/api/Tracking', JSON.stringify({ waybill }), { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
    return data;
}
async function shiprocketTrack(awb) {
    if (!awb)
        throw new errors_1.BadRequestError('awb is required');
    const token = await (0, helpers_1.shiprocketAuth)();
    const { data } = await axios_1.default.get(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`, { headers: { Authorization: `Bearer ${token}` } });
    return data;
}
async function shiprocketCreateOrder(body) {
    const token = await (0, helpers_1.shiprocketAuth)();
    const { data } = await axios_1.default.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', body, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
    return data;
}
// Shiprocket webhook — caller passes raw body; we don't validate signature here
// (env vars + IP allowlisting handled at the gateway).
async function shiprocketWebhook(body) {
    // log + return ack — actual order-status update is done via /api/orders/:id/status
    return { ok: true, received: !!body };
}
//# sourceMappingURL=shipping.service.js.map