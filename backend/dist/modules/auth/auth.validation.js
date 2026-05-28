"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailSchema = exports.signupSchema = exports.adminLoginSchema = exports.verifyOtpSchema = exports.loginRequestOtpSchema = void 0;
const zod_1 = require("zod");
/* ─────────── /api/auth/login ─────────── */
exports.loginRequestOtpSchema = zod_1.z.object({
    emailOrMobile: zod_1.z.string().min(3, 'emailOrMobile is required'),
});
/* ─────────── /api/auth/verify-otp ─────────── */
exports.verifyOtpSchema = zod_1.z.object({
    otp: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    emailOrMobile: zod_1.z.string().min(3),
});
/* ─────────── /api/auth/admin-login ─────────── */
exports.adminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, 'password is required'),
});
/* ─────────── /api/auth/signup ─────────── */
exports.signupSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'username is required'),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6, 'password must be at least 6 chars'),
    number: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
});
/* ─────────── /api/auth/verifyemail ─────────── */
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'token is required'),
});
//# sourceMappingURL=auth.validation.js.map