"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    APP_NAME: zod_1.z.string().default('PrintHutt'),
    APP_URL: zod_1.z.string().default('http://localhost:3000'),
    API_URL: zod_1.z.string().default('http://localhost:4000'),
    MONGO_URL: zod_1.z.string().min(1, 'MONGO_URL is required'),
    REDIS_HOST: zod_1.z.string().default('127.0.0.1'),
    REDIS_PORT: zod_1.z.coerce.number().default(6379),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    REDIS_DB: zod_1.z.coerce.number().default(0),
    ACCESS_TOKEN_SECRET: zod_1.z.string().min(16, 'ACCESS_TOKEN_SECRET required'),
    ACCESS_TOKEN_EXPIRES_IN: zod_1.z.string().default('15m'),
    REFRESH_TOKEN_SECRET: zod_1.z.string().min(16, 'REFRESH_TOKEN_SECRET required'),
    REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default('30d'),
    TOKEN_SECRET: zod_1.z.string().min(8).default('legacy-secret'),
    COOKIE_DOMAIN: zod_1.z.string().optional(),
    COOKIE_SECURE: zod_1.z.coerce.boolean().default(false),
    COOKIE_SAMESITE: zod_1.z.enum(['lax', 'strict', 'none']).default('lax'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    AWS_REGION: zod_1.z.string().optional(),
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_S3_BUCKET_NAME: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().optional(),
    SHIPROCKET_EMAIL: zod_1.z.string().optional(),
    SHIPROCKET_PASSWORD: zod_1.z.string().optional(),
    RAZORPAY_KEY_ID: zod_1.z.string().optional(),
    RAZORPAY_KEY_SECRET: zod_1.z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: zod_1.z.string().optional(),
    PHONEPE_MERCHANT_ID: zod_1.z.string().optional(),
    PHONEPE_SALT_KEY: zod_1.z.string().optional(),
    PHONEPE_SALT_INDEX: zod_1.z.string().optional(),
    PHONEPE_HOST: zod_1.z.string().optional(),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(300),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Env validation failed:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map