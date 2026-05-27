import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { sendCreated, sendOk } from '@/utils/api-response';
import {
  clearAuthCookies,
  REFRESH_COOKIE,
  setAccessCookie,
  setLegacyCookie,
  setRefreshCookie,
} from '@/utils/cookies';
import { UnauthorizedError } from '@/utils/errors';
import { verifyRefreshToken } from '@/utils/jwt';
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
