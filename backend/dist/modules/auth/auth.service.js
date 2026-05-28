"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestOtp = requestOtp;
exports.verifyOtp = verifyOtp;
exports.adminLogin = adminLogin;
exports.signup = signup;
exports.getMe = getMe;
exports.refresh = refresh;
exports.logoutSingle = logoutSingle;
exports.logoutAll = logoutAll;
exports.verifyEmail = verifyEmail;
/**
 * Auth service. Direct port of:
 *   src/app/api/auth/login/route.ts          (request OTP)
 *   src/app/api/auth/verify-otp/route.ts     (verify OTP → token)
 *   src/app/api/auth/admin-login/route.ts    (admin email+password)
 *   src/app/api/auth/signup/route.ts         (register)
 *   src/app/api/auth/me/route.ts             (current user)
 *   src/app/api/auth/logout/route.ts         (clear cookie)
 *   src/app/api/auth/verifyemail/route.ts    (email verify with token)
 *
 * Behaviour preserved exactly. Token mechanism upgraded from jose-single-token
 * to jsonwebtoken access + refresh pair (with Redis-backed rotation), while
 * still emitting the legacy `token` cookie so the existing Next.js edge
 * middleware works unchanged.
 */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const helpers_1 = require("@/utils/helpers");
const jwt_1 = require("@/utils/jwt");
const errors_1 = require("@/utils/errors");
const queues_1 = require("@/queues/queues");
const auth_repository_1 = require("./auth.repository");
const refresh_store_1 = require("./refresh-store");
/* ──────────────── 1. Request OTP (LOGIN step 1) ──────────────── */
async function requestOtp(emailOrMobile) {
    if (!emailOrMobile)
        throw new errors_1.BadRequestError('emailOrMobile is required');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min
    const isEmailInput = (0, helpers_1.isEmail)(emailOrMobile);
    const queryKey = isEmailInput ? 'email' : 'number';
    let user = await auth_repository_1.authRepo.findByEmailOrNumber(queryKey, emailOrMobile);
    if (!user) {
        const data = {
            [queryKey]: emailOrMobile,
            otpVerification: Number(otp),
            otpVerificationExpiry: otpExpiry,
        };
        user = await auth_repository_1.authRepo.create(data);
    }
    else {
        user.otpVerification = Number(otp);
        user.otpVerificationExpiry = new Date(otpExpiry);
        await user.save();
    }
    // Enqueue OTP send through BullMQ — replaces synchronous nodemailer call
    await (0, queues_1.enqueueEmail)({
        type: isEmailInput ? 'otp-email' : 'otp-sms',
        payload: isEmailInput
            ? { email: emailOrMobile, otp }
            : { mobile: emailOrMobile, otp },
    });
}
/* ──────────────── 2. Verify OTP (LOGIN step 2) ──────────────── */
async function verifyOtp(otp, emailOrMobile) {
    if (!emailOrMobile || otp === undefined || otp === null) {
        throw new errors_1.BadRequestError('OTP and emailOrMobile are required.');
    }
    if (isNaN(Number(otp)))
        throw new errors_1.BadRequestError('Invalid OTP format.');
    const isEmailInput = (0, helpers_1.isEmail)(emailOrMobile);
    const queryKey = isEmailInput ? 'email' : 'number';
    const user = await auth_repository_1.authRepo.findByEmailOrNumber(queryKey, emailOrMobile);
    if (!user)
        throw new errors_1.NotFoundError('User not found.');
    if (user.otpVerification !== Number(otp) ||
        !user.otpVerificationExpiry ||
        Date.now() > new Date(user.otpVerificationExpiry).getTime()) {
        throw new errors_1.UnauthorizedError('Invalid or expired OTP.');
    }
    if (!user.isVerified)
        throw new errors_1.ForbiddenError('User not verified.');
    // Clear OTP fields after successful verification (same as original)
    user.otpVerification = undefined;
    user.otpVerificationExpiry = undefined;
    await user.save();
    return issueTokenPair({
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
    });
}
/* ──────────────── 3. Admin login ──────────────── */
async function adminLogin(email, password) {
    if (!email || !password)
        throw new errors_1.BadRequestError('All fields are required');
    const user = await auth_repository_1.authRepo.findByEmail(email);
    if (!user)
        throw new errors_1.BadRequestError('User does not exist');
    if (!user.isVerified)
        throw new errors_1.BadRequestError('User not verified');
    const match = await user.comparePassword(password);
    if (!match)
        throw new errors_1.UnauthorizedError('Check your credentials');
    return issueTokenPair({
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
    });
}
/* ──────────────── 4. Signup ──────────────── */
async function signup(username, email, password, number) {
    if (!username || !email || !password || !number) {
        throw new errors_1.BadRequestError('All fields are required');
    }
    if (!(0, helpers_1.isEmail)(email))
        throw new errors_1.BadRequestError('Invalid email format');
    if (await auth_repository_1.authRepo.findByEmail(email)) {
        throw new errors_1.ConflictError('User with this email already exists');
    }
    if (await auth_repository_1.authRepo.findByNumber(number)) {
        throw new errors_1.ConflictError('User with this number already exists');
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashed = await bcryptjs_1.default.hash(password, salt);
    const created = await auth_repository_1.authRepo.create({
        username,
        email,
        number,
        password: hashed,
    });
    return { id: String(created._id), username: created.username, email: created.email };
}
/* ──────────────── 5. Current user ──────────────── */
async function getMe(id) {
    const user = await auth_repository_1.authRepo.findById(id);
    if (!user)
        throw new errors_1.NotFoundError('User not found');
    return user;
}
/* ──────────────── 6. Refresh token rotation ──────────────── */
async function refresh(token) {
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(token);
    }
    catch {
        throw new errors_1.UnauthorizedError('Invalid refresh token');
    }
    const ok = await (0, refresh_store_1.refreshExists)(payload.id, payload.tokenId);
    if (!ok)
        throw new errors_1.UnauthorizedError('Refresh token revoked');
    // Rotate: revoke the old tokenId, issue a fresh pair
    await (0, refresh_store_1.revokeRefresh)(payload.id, payload.tokenId);
    const user = await auth_repository_1.authRepo.findById(payload.id);
    if (!user)
        throw new errors_1.UnauthorizedError('User no longer exists');
    return issueTokenPair({
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
    });
}
/* ──────────────── 7. Logout (single device) ──────────────── */
async function logoutSingle(userId, tokenId) {
    await (0, refresh_store_1.revokeRefresh)(userId, tokenId);
}
/* ──────────────── 8. Logout (all devices) ──────────────── */
async function logoutAll(userId) {
    await (0, refresh_store_1.revokeAllRefresh)(userId);
}
/* ──────────────── 9. Verify email (via emailed token) ──────────────── */
async function verifyEmail(token) {
    if (!token)
        throw new errors_1.BadRequestError('Token is required');
    const user = await auth_repository_1.authRepo.findByVerifyToken(token);
    if (!user)
        throw new errors_1.BadRequestError('Invalid or expired token');
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    await user.save();
}
/* ──────────────── helper: issue access + refresh + legacy ──────────────── */
async function issueTokenPair(payload) {
    const tokenId = (0, uuid_1.v4)();
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_1.signRefreshToken)({ id: payload.id, tokenId });
    const legacyToken = (0, jwt_1.signLegacyToken)(payload);
    await (0, refresh_store_1.issueRefresh)(payload.id, tokenId);
    return { accessToken, refreshToken, legacyToken, user: payload };
}
//# sourceMappingURL=auth.service.js.map