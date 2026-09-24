import { NextFunction, Request, Response } from 'express';
import {
  AccessTokenPayload,
  Role,
  verifyAccessToken,
  verifyLegacyToken,
} from '../utils/jwt';
import { ACCESS_COOKIE, LEGACY_COOKIE } from '../utils/cookies';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

function extractToken(req: Request): string | null {
  // 1. Bearer header
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  // 2. New access cookie
  const access = (req.cookies as Record<string, string | undefined>)?.[ACCESS_COOKIE];
  if (access) return access;
  // 3. Legacy cookie name (Next.js middleware still writes/reads this)
  const legacy = (req.cookies as Record<string, string | undefined>)?.[LEGACY_COOKIE];
  if (legacy) return legacy;
  return null;
}

function verifyAny(token: string): AccessTokenPayload {
  try {
    return verifyAccessToken(token);
  } catch {
    // fall back — legacy jose-signed token used HS256 with TOKEN_SECRET
    return verifyLegacyToken(token);
  }
}

/**
 * Require any authenticated user.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) throw new UnauthorizedError('Authentication required');
  try {
    req.user = verifyAny(token);
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Optional auth — sets req.user if token present + valid, otherwise continues.
 * Used for cart/wishlist endpoints that work for guest + logged-in.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) return next();
  try {
    req.user = verifyAny(token);
  } catch {
    /* ignore — treat as guest */
  }
  next();
}

/**
 * Role-based guard. Use after requireAuth.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role)) throw new ForbiddenError('Insufficient permissions');
    next();
  };
}

export const requireAdmin = [requireAuth, requireRole('admin')];
