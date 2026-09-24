import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

export type Role = 'user' | 'admin';

export interface AccessTokenPayload extends JwtPayload {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export interface RefreshTokenPayload extends JwtPayload {
  id: string;
  tokenId: string; // jti — used for rotation/revocation
}

/* ──────────────── Access token ──────────────── */
export function signAccessToken(payload: Omit<AccessTokenPayload, keyof JwtPayload>): string {
  const opts: SignOptions = { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}

/* ──────────────── Refresh token ──────────────── */
export function signRefreshToken(payload: Omit<RefreshTokenPayload, keyof JwtPayload>): string {
  const opts: SignOptions = { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, opts);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
}

/* ──────────────── Legacy single-secret (keeps frontend Next middleware happy
   while you migrate — same payload shape jose was signing). ───── */
export function signLegacyToken(payload: Omit<AccessTokenPayload, keyof JwtPayload>): string {
  return jwt.sign(payload, env.TOKEN_SECRET);
}

export function verifyLegacyToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.TOKEN_SECRET) as AccessTokenPayload;
}
