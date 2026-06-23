/**
 * Ported verbatim from frontend src/helpers/helpers.ts so backend
 * keeps identical business behaviour for slug generation, currency
 * formatting, email check and shiprocket auth caching.
 */
import axios from 'axios';
import { env } from '../config/env';

export function isEmail(input: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input);
}

export const generateSlug = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// IST helpers — used by orders / dashboard aggregations
export function getISTDayRange(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00.000+05:30`);
  const end = new Date(`${dateStr}T23:59:59.999+05:30`);
  return { start, end };
}

// Cached Shiprocket auth token (same behaviour as original)
let cachedShiprocketToken: string | null = null;
export async function shiprocketAuth(): Promise<string> {
  if (cachedShiprocketToken) return cachedShiprocketToken;
  const { data } = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
    email: env.SHIPROCKET_EMAIL,
    password: env.SHIPROCKET_PASSWORD,
  });
  cachedShiprocketToken = data.token;
  return cachedShiprocketToken as string;
}

// Static fship token reader (originals returns env or fallback constant)
export function fshipToken(): string {
  return process.env.FSHIP_TOKEN || '85ff1049fdeb8cec7b6774e8ca3ec651ed0caf35801635c478f4224c90f07950';
}

// Trivial normalizers used by order de-dupe address logic
export const norm = (v: unknown): string =>
  String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

export const normDigits = (v: unknown): string => String(v ?? '').replace(/\D/g, '');

/* ─── Velocity Shipping (formerly Shipfast) ─── */
export function velocityBaseUrl(): string {
  return (env.VELOCITY_BASE_URL || 'https://shazam.velocity.in').replace(/\/+$/, '');
}

// Token 24h valid hota hai — cache karke reuse karte hain
let cachedVelocityToken: string | null = null;
let velocityTokenExpiry = 0;

export async function velocityAuth(force = false): Promise<string> {
  const now = Date.now();
  if (!force && cachedVelocityToken && now < velocityTokenExpiry) {
    return cachedVelocityToken;
  }

  const username = env.VELOCITY_USERNAME;
  const password = env.VELOCITY_PASSWORD;
  if (!username || !password) {
    throw new Error('VELOCITY_USERNAME / VELOCITY_PASSWORD env missing');
  }

  const { data } = await axios.post(
    `${velocityBaseUrl()}/custom/api/v1/auth-token`,
    { username, password },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const token = data?.token as string | undefined;
  if (!token) throw new Error('Velocity auth: token not returned');

  cachedVelocityToken = token;
  // expires_at parse karo; warna safe 23h cache
  const exp = data?.expires_at ? new Date(data.expires_at).getTime() : 0;
  velocityTokenExpiry = exp > now ? exp - 60_000 : now + 23 * 60 * 60 * 1000;

  return token;
}
