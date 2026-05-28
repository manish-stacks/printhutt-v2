"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../config/logger");
const errors_1 = require("../utils/errors");
const env_1 = require("../config/env");
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
}
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    // ── Operational AppError ─────────────────
    if (err instanceof errors_1.AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
            ...(err.details ? { details: err.details } : {}),
        });
        return;
    }
    // ── Zod validation ─────────────────
    if (err instanceof zod_1.ZodError) {
        res.status(422).json({
            success: false,
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: err.flatten(),
        });
        return;
    }
    // ── Mongoose validation / cast ─────────────────
    if (err instanceof mongoose_1.default.Error.ValidationError) {
        res.status(422).json({
            success: false,
            message: 'Mongoose validation failed',
            code: 'VALIDATION_ERROR',
            details: Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message])),
        });
        return;
    }
    if (err instanceof mongoose_1.default.Error.CastError) {
        res.status(400).json({
            success: false,
            message: `Invalid ${err.path}`,
            code: 'CAST_ERROR',
        });
        return;
    }
    // ── Mongo duplicate key ─────────────────
    // @ts-expect-error - native MongoServerError shape
    if (err && err.code === 11000) {
        res.status(409).json({
            success: false,
            message: 'Duplicate key',
            // @ts-expect-error - keyValue is present on duplicate-key errors
            details: err.keyValue,
        });
        return;
    }
    // ── Unknown ─────────────────
    const e = err;
    logger_1.logger.error('Unhandled error', { error: e?.message, stack: e?.stack, url: req.originalUrl });
    res.status(500).json({
        success: false,
        message: env_1.env.NODE_ENV === 'production' ? 'Internal server error' : e?.message || 'Unknown error',
    });
}
//# sourceMappingURL=error.middleware.js.map