"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
/**
 * Run a Zod schema on req[source]. On success, mutates req[source] to the parsed value.
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
    const parsed = schema.parse(req[source]);
    // overwrite with parsed/typed value
    req[source] = parsed;
    next();
};
exports.validate = validate;
//# sourceMappingURL=validate.middleware.js.map