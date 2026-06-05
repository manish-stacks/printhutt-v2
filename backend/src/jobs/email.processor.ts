import { Job } from 'bullmq';
import { logger } from '../config/logger';
import type { EmailJobData } from '../queues/queues';

export async function emailProcessor(job: Job<EmailJobData>): Promise<void> {
  const { type, payload } = job.data;
  logger.info(`[queue:email] processing ${type}`, { id: job.id });

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

    /* ─── NEW: Custom admin-sent emails ─── */
    case 'custom-email': {
      const m = mailer as unknown as {
        sendCustomEmail: (p: { to: string; subject: string; html: string }) => Promise<unknown>;
      };
      const toEmail = String(payload.email || '').trim();
      if (!toEmail || !toEmail.includes('@')) {
        logger.warn('[queue:email] custom-email skipped — no recipient', { logId: payload.logId });
        return; // skip silently
      }

      await m.sendCustomEmail({
        to: String(payload.email),
        subject: String(payload.subject || 'Message from PrintHutt'),
        html: String(payload.body),
      });
      return;
    }

    /* ─── NEW: Custom admin-sent SMS/WhatsApp ─── */
    case 'custom-sms': {
      const m = mailer as unknown as {
        sendCustomSms: (mobile: string, body: string) => Promise<unknown>;
      };
      await m.sendCustomSms(String(payload.mobile), String(payload.body));
      return;
    }

    case 'order-confirm': {
      logger.info(`[queue:email] order email ${type}`, { payload });
      return;
    }

    case 'order-status': {
      logger.info(`[queue:email] order email ${type}`, { payload });
      return;
    }
    default:
      throw new Error(`Unknown email job type: ${type as string}`);
  }
}