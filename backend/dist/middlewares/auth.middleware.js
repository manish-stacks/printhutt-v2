"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
exports.requireRole = requireRole;
const jwt_1 = require("../utils/jwt");
const cookies_1 = require("../utils/cookies");
const errors_1 = require("../utils/errors");
function extractToken(req) {
    // 1. Bearer header
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer '))
        return auth.slice(7);
    // 2. New access cookie
    const access = req.cookies?.[cookies_1.ACCESS_COOKIE];
    if (access)
        return access;
    // 3. Legacy cookie name (Next.js middleware still writes/reads this)
    const legacy = req.cookies?.[cookies_1.LEGACY_COOKIE];
    if (legacy)
        return legacy;
    return null;
}
function verifyAny(token) {
    try {
        return (0, jwt_1.verifyAccessToken)(token);
    }
    catch {
        // fall back — legacy jose-signed token used HS256 with TOKEN_SECRET
        return (0, jwt_1.verifyLegacyToken)(token);
    }
}
/**
 * Require any authenticated user.
 */
function requireAuth(req, _res, next) {
    const token = extractToken(req);
    if (!token)
        throw new errors_1.UnauthorizedError('Authentication required');
    try {
        req.user = verifyAny(token);
        next();
    }
    catch {
        throw new errors_1.UnauthorizedError('Invalid or expired token');
    }
}
/**
 * Optional auth — sets req.user if token present + valid, otherwise continues.
 * Used for cart/wishlist endpoints that work for guest + logged-in.
 */
function optionalAuth(req, _res, next) {
    const token = extractToken(req);
    if (!token)
        return next();
    try {
        req.user = verifyAny(token);
    }
    catch {
        /* ignore — treat as guest */
    }
    next();
}
/**
 * Role-based guard. Use after requireAuth.
 */
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user)
            throw new errors_1.UnauthorizedError();
        if (!roles.includes(req.user.role))
            throw new errors_1.ForbiddenError('Insufficient permissions');
        next();
    };
}
exports.requireAdmin = [requireAuth, requireRole('admin')];
//# sourceMappingURL=auth.middleware.js.map