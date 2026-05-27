import { z } from 'zod';

/* ─────────── /api/auth/login ─────────── */
export const loginRequestOtpSchema = z.object({
  emailOrMobile: z.string().min(3, 'emailOrMobile is required'),
});
export type LoginRequestOtpDTO = z.infer<typeof loginRequestOtpSchema>;

/* ─────────── /api/auth/verify-otp ─────────── */
export const verifyOtpSchema = z.object({
  otp: z.union([z.string(), z.number()]),
  emailOrMobile: z.string().min(3),
});
export type VerifyOtpDTO = z.infer<typeof verifyOtpSchema>;

/* ─────────── /api/auth/admin-login ─────────── */
export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'password is required'),
});
export type AdminLoginDTO = z.infer<typeof adminLoginSchema>;

/* ─────────── /api/auth/signup ─────────── */
export const signupSchema = z.object({
  username: z.string().min(1, 'username is required'),
  email: z.string().email(),
  password: z.string().min(6, 'password must be at least 6 chars'),
  number: z.union([z.string(), z.number()]),
});
export type SignupDTO = z.infer<typeof signupSchema>;

/* ─────────── /api/auth/verifyemail ─────────── */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'token is required'),
});
export type VerifyEmailDTO = z.infer<typeof verifyEmailSchema>;
