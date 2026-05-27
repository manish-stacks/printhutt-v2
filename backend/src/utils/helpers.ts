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
