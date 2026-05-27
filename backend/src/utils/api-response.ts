import { Response } from 'express';

/**
 * Standard envelope for API responses. `success` is auto-added by sendOk /
 * sendCreated, so callers only need to supply the payload.
 */
export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export const sendOk = <T>(
  res: Response,
  payload: ApiResponse<T> = {},
  status = 200
): Response => res.status(status).json({ success: true, ...payload });

export const sendCreated = <T>(
  res: Response,
  payload: ApiResponse<T> = {}
): Response => res.status(201).json({ success: true, ...payload });
