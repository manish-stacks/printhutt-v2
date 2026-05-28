"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normDigits = exports.norm = exports.generateSlug = void 0;
exports.isEmail = isEmail;
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.getISTDayRange = getISTDayRange;
exports.shiprocketAuth = shiprocketAuth;
exports.fshipToken = fshipToken;
/**
 * Ported verbatim from frontend src/helpers/helpers.ts so backend
 * keeps identical business behaviour for slug generation, currency
 * formatting, email check and shiprocket auth caching.
 */
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
function isEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
}
const generateSlug = (text) => text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
exports.generateSlug = generateSlug;
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Math.round(amount));
}
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}
// IST helpers — used by orders / dashboard aggregations
function getISTDayRange(dateStr) {
    const start = new Date(`${dateStr}T00:00:00.000+05:30`);
    const end = new Date(`${dateStr}T23:59:59.999+05:30`);
    return { start, end };
}
// Cached Shiprocket auth token (same behaviour as original)
let cachedShiprocketToken = null;
async function shiprocketAuth() {
    if (cachedShiprocketToken)
        return cachedShiprocketToken;
    const { data } = await axios_1.default.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
        email: env_1.env.SHIPROCKET_EMAIL,
        password: env_1.env.SHIPROCKET_PASSWORD,
    });
    cachedShiprocketToken = data.token;
    return cachedShiprocketToken;
}
// Static fship token reader (originals returns env or fallback constant)
function fshipToken() {
    return process.env.FSHIP_TOKEN || '85ff1049fdeb8cec7b6774e8ca3ec651ed0caf35801635c478f4224c90f07950';
}
// Trivial normalizers used by order de-dupe address logic
const norm = (v) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
exports.norm = norm;
const normDigits = (v) => String(v ?? '').replace(/\D/g, '');
exports.normDigits = normDigits;
//# sourceMappingURL=helpers.js.map