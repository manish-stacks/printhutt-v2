"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_COOKIE = exports.REFRESH_COOKIE = exports.ACCESS_COOKIE = void 0;
exports.setAccessCookie = setAccessCookie;
exports.setRefreshCookie = setRefreshCookie;
exports.setLegacyCookie = setLegacyCookie;
exports.clearAuthCookies = clearAuthCookies;
const env_1 = require("../config/env");
const ms = (s) => {
    // tiny parser: 15m / 1h / 7d / 30d / 90s
    const m = /^(\d+)([smhd])$/.exec(s);
    if (!m)
        return 0;
    const n = Number(m[1]);
    switch (m[2]) {
        case 's':
            return n * 1000;
        case 'm':
            return n * 60_000;
        case 'h':
            return n * 3_600_000;
        case 'd':
            return n * 86_400_000;
        default:
            return 0;
    }
};
const baseOpts = () => ({
    httpOnly: true,
    secure: env_1.env.COOKIE_SECURE,
    sameSite: env_1.env.COOKIE_SAMESITE,
    domain: env_1.env.COOKIE_DOMAIN || undefined,
    path: '/',
});
exports.ACCESS_COOKIE = 'access_token';
exports.REFRESH_COOKIE = 'refresh_token';
// Legacy cookie name the Next.js middleware reads — keep so existing
// frontend middleware does not break during migration.
exports.LEGACY_COOKIE = 'token';
function setAccessCookie(res, token) {
    res.cookie(exports.ACCESS_COOKIE, token, {
        ...baseOpts(),
        maxAge: ms(env_1.env.ACCESS_TOKEN_EXPIRES_IN),
    });
}
function setRefreshCookie(res, token) {
    res.cookie(exports.REFRESH_COOKIE, token, {
        ...baseOpts(),
        maxAge: ms(env_1.env.REFRESH_TOKEN_EXPIRES_IN),
        path: '/', // could narrow to /api/auth/refresh
    });
}
function setLegacyCookie(res, token) {
    res.cookie(exports.LEGACY_COOKIE, token, {
        ...baseOpts(),
        maxAge: 7 * 86_400_000,
    });
}
function clearAuthCookies(res) {
    res.clearCookie(exports.ACCESS_COOKIE, baseOpts());
    res.clearCookie(exports.REFRESH_COOKIE, baseOpts());
    res.clearCookie(exports.LEGACY_COOKIE, baseOpts());
}
//# sourceMappingURL=cookies.js.map