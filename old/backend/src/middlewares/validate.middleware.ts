import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Run a Zod schema on req[source]. On success, mutates req[source] to the parsed value.
 */
export const validate =
  (schema: ZodSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse(req[source]);
    // overwrite with parsed/typed value
    (req as unknown as Record<string, unknown>)[source] = parsed;
    next();
  };
