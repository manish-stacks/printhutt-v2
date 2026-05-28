"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.param = void 0;
/**
 * Express 5 typings widen `req.params[key]` to `string | string[]`. In
 * practice path params are always single strings; this helper narrows safely.
 */
const param = (req, key) => {
    const v = req.params[key];
    if (Array.isArray(v))
        return v[0] ?? '';
    return v ?? '';
};
exports.param = param;
//# sourceMappingURL=req.js.map