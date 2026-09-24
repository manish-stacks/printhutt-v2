import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import {
  clearAuthCookies,
  ACCESS_COOKIE,
  LEGACY_COOKIE,
  REFRESH_COOKIE,
  setAccessCookie,
  setLegacyCookie,
  setRefreshCookie,
} from '@/utils/cookies';
import { UnauthorizedError } from '@/utils/errors';
import { verifyAccessToken, verifyLegacyToken, verifyRefreshToken } from '@/utils/jwt';
import * as authService from './auth.service';
import type {
  AdminLoginDTO,
  LoginRequestOtpDTO,
  SignupDTO,
  VerifyEmailDTO,
  VerifyOtpDTO,
} from './auth.validation';

/* POST /api/auth/login  — step 1: request OTP */
export const loginRequestOtp = asyncHandler(async (req: Request, res: Response) => {
  const { emailOrMobile } = req.body as LoginRequestOtpDTO;
  await authService.requestOtp(emailOrMobile);
  return sendOk(res, { message: 'OTP sent successfully' });
});

/* POST /api/auth/verify-otp  — step 2: verify + issue tokens */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { otp, emailOrMobile } = req.body as VerifyOtpDTO;
  const tokens = await authService.verifyOtp(otp, emailOrMobile);

  setAccessCookie(res, tokens.accessToken);
  setRefreshCookie(res, tokens.refreshToken);
  setLegacyCookie(res, tokens.legacyToken);

  return sendOk(res, {
    message: 'OTP verified successfully.',
    role: tokens.user.role,
    user: tokens.user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

/* POST /api/auth/admin-login */
export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as AdminLoginDTO;
  const tokens = await authService.adminLogin(email, password);

  setAccessCookie(res, tokens.accessToken);
  setRefreshCookie(res, tokens.refreshToken);
  setLegacyCookie(res, tokens.legacyToken);

  return sendOk(res, {
    message: 'Logged In Success.',
    role: tokens.user.role,
    user: tokens.user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

/* POST /api/auth/signup */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, number } = req.body as SignupDTO;
  const user = await authService.signup(username, email, password, number);
  return sendCreated(res, { message: 'User registered successfully', user });
});

/* POST /api/auth/me */
export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const user = await authService.getMe(req.user.id);
  return sendOk(res, { message: 'User Found', user });
});

/* POST /api/auth/refresh — rotates the pair */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const cookies = (req.cookies as Record<string, string | undefined>) ?? {};
  const body = (req.body as { refreshToken?: string }) ?? {};
  const token = cookies[REFRESH_COOKIE] ?? body.refreshToken;
  if (!token) throw new UnauthorizedError('Refresh token missing');

  const tokens = await authService.refresh(token);
  setAccessCookie(res, tokens.accessToken);
  setRefreshCookie(res, tokens.refreshToken);
  setLegacyCookie(res, tokens.legacyToken);

  return sendOk(res, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

/* GET /api/auth/logout — single device */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const cookies = (req.cookies as Record<string, string | undefined>) ?? {};
  const refreshTok = cookies[REFRESH_COOKIE];
  if (refreshTok) {
    try {
      const p = verifyRefreshToken(refreshTok);
      await authService.logoutSingle(p.id, p.tokenId);
    } catch {
      /* token already invalid — fine */
    }
  }
  clearAuthCookies(res);
  return sendOk(res, { message: 'Logout successfully' });
});

/* POST /api/auth/logout-all — every device */
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  await authService.logoutAll(req.user.id);
  clearAuthCookies(res);
  return sendOk(res, { message: 'Logged out from all devices' });
});

/* POST /api/auth/verifyemail */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body as VerifyEmailDTO;
  await authService.verifyEmail(token);
  return sendOk(res, { message: 'Email verified successfully' });
});


/* GET /api/auth/session — guest-safe session probe (kabhi 401 nahi deta).
 * Access valid → user; access expire + refresh valid → rotate + user; warna {success:false}.
 * Frontend ka mount-time check isi se hota hai → guest pe console 401 spam band. */
export const session = asyncHandler(async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  const cookies = (req.cookies as Record<string, string | undefined>) ?? {};
  let userId: string | null = null;
  let accessToken: string | undefined;

  const tryVerify = (fn: () => { id: string }) => { try { return fn().id; } catch { return null; } };
  if (cookies[ACCESS_COOKIE]) userId = tryVerify(() => verifyAccessToken(cookies[ACCESS_COOKIE]!));
  if (!userId && cookies[LEGACY_COOKIE]) userId = tryVerify(() => verifyLegacyToken(cookies[LEGACY_COOKIE]!));

  if (!userId && cookies[REFRESH_COOKIE]) {
    try {
      const tokens = await authService.refresh(cookies[REFRESH_COOKIE]!);
      setAccessCookie(res, tokens.accessToken);
      setRefreshCookie(res, tokens.refreshToken);
      setLegacyCookie(res, tokens.legacyToken);
      accessToken = tokens.accessToken;
      userId = verifyRefreshToken(tokens.refreshToken).id;
    } catch {
      clearAuthCookies(res); // revoked/expired refresh → stale cookies saaf
    }
  }

  if (!userId) return res.status(200).json({ success: false, user: null });
  try {
    const user = await authService.getMe(userId);
    return res.status(200).json({ success: true, user, ...(accessToken ? { accessToken } : {}) });
  } catch {
    return res.status(200).json({ success: false, user: null });
  }
});
