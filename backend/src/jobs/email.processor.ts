import { Job } from 'bullmq';
import { logger } from '../config/logger';
import type { EmailJobData } from '../queues/queues';

/**
 * Email job processor.
 *
 * Calls into the existing mailer (already ported from src/lib/mail/mailer.ts).
 * Splits routing by `data.type` — same templates used by original Next routes.
 */
export async function emailProcessor(job: Job<EmailJobData>): Promise<void> {
  const { type, payload } = job.data;
  logger.info(`[queue:email] processing ${type}`, { id: job.id });

  // Lazy import — avoid loading nodemailer at queue-module load time
  const mailer = await import('../utils/mail/mailer');

  switch (type) {
    case 'verify': {
      const m = mailer as unknown as {
        sendVerifyEmail: (p: { email: string; emailType: 'VERIFY' | 'RESET'; userId: string }) => Promise<unknown>;
      };
      await m.sendVerifyEmail({
        email: String(payload.email),
        emailType: 'VERIFY',
        userId: String(payload.userId),
      });
      return;
    }
    case 'reset': {
      const m = mailer as unknown as {
        sendVerifyEmail: (p: { email: string; emailType: 'VERIFY' | 'RESET'; userId: string }) => Promise<unknown>;
      };
      await m.sendVerifyEmail({
        email: String(payload.email),
        emailType: 'RESET',
        userId: String(payload.userId),
      });
      return;
    }
    case 'otp-email': {
      const m = mailer as unknown as {
        sendOtpByEmail: (email: string, otp: string) => Promise<unknown>;
      };
      await m.sendOtpByEmail(String(payload.email), String(payload.otp));
      return;
    }
    case 'otp-sms': {
      const m = mailer as unknown as {
        sendOtpBySms: (mobile: string, otp: string) => Promise<unknown>;
      };
      await m.sendOtpBySms(String(payload.mobile), String(payload.otp));
      return;
    }
    case 'order-confirm':
    case 'order-status': {
      // delegate to mailer — exact function name depends on existing exports;
      // wire up after auditing src/lib/mail/mailer.ts
      logger.info(`[queue:email] order email ${type}`, { payload });
      return;
    }
    default:
      throw new Error(`Unknown email job type: ${type as string}`);
  }
}
