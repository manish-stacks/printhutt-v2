import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // ── Operational AppError ─────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // ── Zod validation ─────────────────
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten(),
    });
    return;
  }

  // ── Mongoose validation / cast ─────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(422).json({
      success: false,
      message: 'Mongoose validation failed',
      code: 'VALIDATION_ERROR',
      details: Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, v.message])
      ),
    });
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid ${err.path}`,
      code: 'CAST_ERROR',
    });
    return;
  }

  // ── Mongo duplicate key ─────────────────
  // @ts-expect-error - native MongoServerError shape
  if (err && err.code === 11000) {
    res.status(409).json({
      success: false,
      message: 'Duplicate key',
      // @ts-expect-error - keyValue is present on duplicate-key errors
      details: err.keyValue,
    });
    return;
  }

  // ── Unknown ─────────────────
  const e = err as Error;
  logger.error('Unhandled error', { error: e?.message, stack: e?.stack, url: req.originalUrl });
  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : e?.message || 'Unknown error',
  });
}
