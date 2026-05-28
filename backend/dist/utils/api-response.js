"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCreated = exports.sendOk = void 0;
const sendOk = (res, payload = {}, status = 200) => res.status(status).json({ success: true, ...payload });
exports.sendOk = sendOk;
const sendCreated = (res, payload = {}) => res.status(201).json({ success: true, ...payload });
exports.sendCreated = sendCreated;
//# sourceMappingURL=api-response.js.map