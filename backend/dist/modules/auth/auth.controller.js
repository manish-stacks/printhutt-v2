"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = exports.logoutAll = exports.logout = exports.refresh = exports.me = exports.signup = exports.adminLogin = exports.verifyOtp = exports.loginRequestOtp = void 0;
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const cookies_1 = require("@/utils/cookies");
const errors_1 = require("@/utils/errors");
const jwt_1 = require("@/utils/jwt");
const authService = __importStar(require("./auth.service"));
/* POST /api/auth/login  — step 1: request OTP */
exports.loginRequestOtp = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { emailOrMobile } = req.body;
    await authService.requestOtp(emailOrMobile);
    return (0, api_response_1.sendOk)(res, { message: 'OTP sent successfully' });
});
/* POST /api/auth/verify-otp  — step 2: verify + issue tokens */
exports.verifyOtp = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { otp, emailOrMobile } = req.body;
    const tokens = await authService.verifyOtp(otp, emailOrMobile);
    (0, cookies_1.setAccessCookie)(res, tokens.accessToken);
    (0, cookies_1.setRefreshCookie)(res, tokens.refreshToken);
    (0, cookies_1.setLegacyCookie)(res, tokens.legacyToken);
    return (0, api_response_1.sendOk)(res, {
        message: 'OTP verified successfully.',
        role: tokens.user.role,
        user: tokens.user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    });
});
/* POST /api/auth/admin-login */
exports.adminLogin = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const tokens = await authService.adminLogin(email, password);
    (0, cookies_1.setAccessCookie)(res, tokens.accessToken);
    (0, cookies_1.setRefreshCookie)(res, tokens.refreshToken);
    (0, cookies_1.setLegacyCookie)(res, tokens.legacyToken);
    return (0, api_response_1.sendOk)(res, {
        message: 'Logged In Success.',
        role: tokens.user.role,
        user: tokens.user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    });
});
/* POST /api/auth/signup */
exports.signup = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { username, email, password, number } = req.body;
    const user = await authService.signup(username, email, password, number);
    return (0, api_response_1.sendCreated)(res, { message: 'User registered successfully', user });
});
/* POST /api/auth/me */
exports.me = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.UnauthorizedError();
    const user = await authService.getMe(req.user.id);
    return (0, api_response_1.sendOk)(res, { message: 'User Found', user });
});
/* POST /api/auth/refresh — rotates the pair */
exports.refresh = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const cookies = req.cookies ?? {};
    const body = req.body ?? {};
    const token = cookies[cookies_1.REFRESH_COOKIE] ?? body.refreshToken;
    if (!token)
        throw new errors_1.UnauthorizedError('Refresh token missing');
    const tokens = await authService.refresh(token);
    (0, cookies_1.setAccessCookie)(res, tokens.accessToken);
    (0, cookies_1.setRefreshCookie)(res, tokens.refreshToken);
    (0, cookies_1.setLegacyCookie)(res, tokens.legacyToken);
    return (0, api_response_1.sendOk)(res, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    });
});
/* GET /api/auth/logout — single device */
exports.logout = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const cookies = req.cookies ?? {};
    const refreshTok = cookies[cookies_1.REFRESH_COOKIE];
    if (refreshTok) {
        try {
            const p = (0, jwt_1.verifyRefreshToken)(refreshTok);
            await authService.logoutSingle(p.id, p.tokenId);
        }
        catch {
            /* token already invalid — fine */
        }
    }
    (0, cookies_1.clearAuthCookies)(res);
    return (0, api_response_1.sendOk)(res, { message: 'Logout successfully' });
});
/* POST /api/auth/logout-all — every device */
exports.logoutAll = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.UnauthorizedError();
    await authService.logoutAll(req.user.id);
    (0, cookies_1.clearAuthCookies)(res);
    return (0, api_response_1.sendOk)(res, { message: 'Logged out from all devices' });
});
/* POST /api/auth/verifyemail */
exports.verifyEmail = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { token } = req.body;
    await authService.verifyEmail(token);
    return (0, api_response_1.sendOk)(res, { message: 'Email verified successfully' });
});
//# sourceMappingURL=auth.controller.js.map