"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.signLegacyToken = signLegacyToken;
exports.verifyLegacyToken = verifyLegacyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
/* ──────────────── Access token ──────────────── */
function signAccessToken(payload) {
    const opts = { expiresIn: env_1.env.ACCESS_TOKEN_EXPIRES_IN };
    return jsonwebtoken_1.default.sign(payload, env_1.env.ACCESS_TOKEN_SECRET, opts);
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.ACCESS_TOKEN_SECRET);
}
/* ──────────────── Refresh token ──────────────── */
function signRefreshToken(payload) {
    const opts = { expiresIn: env_1.env.REFRESH_TOKEN_EXPIRES_IN };
    return jsonwebtoken_1.default.sign(payload, env_1.env.REFRESH_TOKEN_SECRET, opts);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.REFRESH_TOKEN_SECRET);
}
/* ──────────────── Legacy single-secret (keeps frontend Next middleware happy
   while you migrate — same payload shape jose was signing). ───── */
function signLegacyToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.TOKEN_SECRET);
}
function verifyLegacyToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.TOKEN_SECRET);
}
//# sourceMappingURL=jwt.js.map