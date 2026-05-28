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
exports.emailProcessor = emailProcessor;
const logger_1 = require("../config/logger");
/**
 * Email job processor.
 *
 * Calls into the existing mailer (already ported from src/lib/mail/mailer.ts).
 * Splits routing by `data.type` — same templates used by original Next routes.
 */
async function emailProcessor(job) {
    const { type, payload } = job.data;
    logger_1.logger.info(`[queue:email] processing ${type}`, { id: job.id });
    // Lazy import — avoid loading nodemailer at queue-module load time
    const mailer = await Promise.resolve().then(() => __importStar(require('../utils/mail/mailer')));
    switch (type) {
        case 'verify': {
            const m = mailer;
            await m.sendVerifyEmail({
                email: String(payload.email),
                emailType: 'VERIFY',
                userId: String(payload.userId),
            });
            return;
        }
        case 'reset': {
            const m = mailer;
            await m.sendVerifyEmail({
                email: String(payload.email),
                emailType: 'RESET',
                userId: String(payload.userId),
            });
            return;
        }
        case 'otp-email': {
            const m = mailer;
            await m.sendOtpByEmail(String(payload.email), String(payload.otp));
            return;
        }
        case 'otp-sms': {
            const m = mailer;
            await m.sendOtpBySms(String(payload.mobile), String(payload.otp));
            return;
        }
        case 'order-confirm':
        case 'order-status': {
            // delegate to mailer — exact function name depends on existing exports;
            // wire up after auditing src/lib/mail/mailer.ts
            logger_1.logger.info(`[queue:email] order email ${type}`, { payload });
            return;
        }
        default:
            throw new Error(`Unknown email job type: ${type}`);
    }
}
//# sourceMappingURL=email.processor.js.map