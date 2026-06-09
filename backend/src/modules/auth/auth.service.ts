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
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { isEmail } from '@/utils/helpers';
import {
  signAccessToken,
  signRefreshToken,
  signLegacyToken,
  verifyRefreshToken,
  type AccessTokenPayload,
} from '@/utils/jwt';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors';
import { enqueueEmail } from '@/queues/queues';
import { authRepo } from './auth.repository';
import {
  issueRefresh,
  refreshExists,
  revokeAllRefresh,
  revokeRefresh,
} from './refresh-store';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  legacyToken: string;
  user: AccessTokenPayload;
}

/* ──────────────── 1. Request OTP (LOGIN step 1) ──────────────── */
export async function requestOtp(emailOrMobile: string): Promise<void> {
  if (!emailOrMobile) throw new BadRequestError('emailOrMobile is required');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min

  const isEmailInput = isEmail(emailOrMobile);
  const queryKey: 'email' | 'number' = isEmailInput ? 'email' : 'number';

  let user = await authRepo.findByEmailOrNumber(queryKey, emailOrMobile);

  if (user?.isBlocked) {
    throw new ForbiddenError(
      'Your account has been blocked. Contact support.'
    );
  }

  if (!user) {
    const data: Record<string, unknown> = {
      [queryKey]: emailOrMobile,
      otpVerification: Number(otp),
      otpVerificationExpiry: otpExpiry,
    };
    user = await authRepo.create(data);
  } else {
    user.otpVerification = Number(otp);
    user.otpVerificationExpiry = new Date(otpExpiry);
    await user.save();
  }

  //  FIX: Try queue first, fallback to direct send if queue/Redis is down

  try {
    await enqueueEmail({
      type: isEmailInput ? 'otp-email' : 'otp-sms',
      payload: isEmailInput
        ? { email: emailOrMobile, otp }
        : { mobile: emailOrMobile, otp },
    });
  } catch (queueErr) {
    const { logger } = await import('@/config/logger');
    logger.warn('[auth] BullMQ queue failed, sending OTP directly', { error: queueErr });
    const mailer = await import('@/utils/mail/mailer');
    if (isEmailInput) {
      await (mailer as unknown as { sendOtpByEmail: (e: string, o: string) => Promise<unknown> })
        .sendOtpByEmail(emailOrMobile, otp);
    } else {
      await (mailer as unknown as { sendOtpBySms: (m: string, o: string) => Promise<unknown> })
        .sendOtpBySms(emailOrMobile, otp);
    }
  }
}

/* ──────────────── 2. Verify OTP (LOGIN step 2) ──────────────── */
export async function verifyOtp(
  otp: string | number,
  emailOrMobile: string
): Promise<IssuedTokens> {
  if (!emailOrMobile || otp === undefined || otp === null) {
    throw new BadRequestError('OTP and emailOrMobile are required.');
  }
  if (isNaN(Number(otp))) throw new BadRequestError('Invalid OTP format.');

  const isEmailInput = isEmail(emailOrMobile);
  const queryKey: 'email' | 'number' = isEmailInput ? 'email' : 'number';

  const user = await authRepo.findByEmailOrNumber(queryKey, emailOrMobile);
  if (!user) throw new NotFoundError('User not found.');

  if (
    user.otpVerification !== Number(otp) ||
    !user.otpVerificationExpiry ||
    Date.now() > new Date(user.otpVerificationExpiry).getTime()
  ) {
    throw new UnauthorizedError('Invalid or expired OTP.');
  }

  if (!user.isVerified) throw new ForbiddenError('User not verified.');

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
export async function adminLogin(
  email: string,
  password: string
): Promise<IssuedTokens> {
  if (!email || !password) throw new BadRequestError('All fields are required');

  const user = await authRepo.findByEmail(email);
  if (!user) throw new BadRequestError('User does not exist');
  if (!user.isVerified) throw new BadRequestError('User not verified');

  const match = await user.comparePassword(password);
  if (!match) throw new UnauthorizedError('Check your credentials');

  return issueTokenPair({
    id: String(user._id),
    username: user.username,
    email: user.email,
    role: user.role,
  });
}

/* ──────────────── 4. Signup ──────────────── */
export async function signup(
  username: string,
  email: string,
  password: string,
  number: string | number
): Promise<{ id: string; username: string; email: string }> {
  if (!username || !email || !password || !number) {
    throw new BadRequestError('All fields are required');
  }
  if (!isEmail(email)) throw new BadRequestError('Invalid email format');

  if (await authRepo.findByEmail(email)) {
    throw new ConflictError('User with this email already exists');
  }
  if (await authRepo.findByNumber(number)) {
    throw new ConflictError('User with this number already exists');
  }

  const salt = await bcryptjs.genSalt(10);
  const hashed = await bcryptjs.hash(password, salt);

  const created = await authRepo.create({
    username,
    email,
    number,
    password: hashed,
  });

  return { id: String(created._id), username: created.username, email: created.email };
}

/* ──────────────── 5. Current user ──────────────── */
export async function getMe(id: string): Promise<unknown> {
  const user = await authRepo.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

/* ──────────────── 6. Refresh token rotation ──────────────── */
export async function refresh(token: string): Promise<IssuedTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const ok = await refreshExists(payload.id, payload.tokenId);
  if (!ok) throw new UnauthorizedError('Refresh token revoked');

  // Rotate: revoke the old tokenId, issue a fresh pair
  await revokeRefresh(payload.id, payload.tokenId);

  const user = await authRepo.findById(payload.id);
  if (!user) throw new UnauthorizedError('User no longer exists');

  return issueTokenPair({
    id: String(user._id),
    username: user.username,
    email: user.email,
    role: user.role,
  });
}

/* ──────────────── 7. Logout (single device) ──────────────── */
export async function logoutSingle(userId: string, tokenId: string): Promise<void> {
  await revokeRefresh(userId, tokenId);
}

/* ──────────────── 8. Logout (all devices) ──────────────── */
export async function logoutAll(userId: string): Promise<void> {
  await revokeAllRefresh(userId);
}

/* ──────────────── 9. Verify email (via emailed token) ──────────────── */
export async function verifyEmail(token: string): Promise<void> {
  if (!token) throw new BadRequestError('Token is required');

  const user = await authRepo.findByVerifyToken(token);
  if (!user) throw new BadRequestError('Invalid or expired token');

  user.isVerified = true;
  user.verifyToken = undefined;
  user.verifyTokenExpiry = undefined;
  await user.save();
}

/* ──────────────── helper: issue access + refresh + legacy ──────────────── */
async function issueTokenPair(payload: AccessTokenPayload): Promise<IssuedTokens> {
  const tokenId = uuidv4();
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ id: payload.id, tokenId });
  const legacyToken = signLegacyToken(payload);
  await issueRefresh(payload.id, tokenId);
  return { accessToken, refreshToken, legacyToken, user: payload };
}
