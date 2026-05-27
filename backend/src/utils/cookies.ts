import { CookieOptions, Response } from 'express';
import { env } from '../config/env';

const ms = (s: string): number => {
  // tiny parser: 15m / 1h / 7d / 30d / 90s
  const m = /^(\d+)([smhd])$/.exec(s);
  if (!m) return 0;
  const n = Number(m[1]);
  switch (m[2]) {
    case 's':
      return n * 1000;
    case 'm':
      return n * 60_000;
    case 'h':
      return n * 3_600_000;
    case 'd':
      return n * 86_400_000;
    default:
      return 0;
  }
};

const baseOpts = (): CookieOptions => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAMESITE,
  domain: env.COOKIE_DOMAIN || undefined,
  path: '/',
});

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
// Legacy cookie name the Next.js middleware reads — keep so existing
// frontend middleware does not break during migration.
export const LEGACY_COOKIE = 'token';

export function setAccessCookie(res: Response, token: string): void {
  res.cookie(ACCESS_COOKIE, token, {
    ...baseOpts(),
    maxAge: ms(env.ACCESS_TOKEN_EXPIRES_IN),
  });
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    ...baseOpts(),
    maxAge: ms(env.REFRESH_TOKEN_EXPIRES_IN),
    path: '/', // could narrow to /api/auth/refresh
  });
}

export function setLegacyCookie(res: Response, token: string): void {
  res.cookie(LEGACY_COOKIE, token, {
    ...baseOpts(),
    maxAge: 7 * 86_400_000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, baseOpts());
  res.clearCookie(REFRESH_COOKIE, baseOpts());
  res.clearCookie(LEGACY_COOKIE, baseOpts());
}
