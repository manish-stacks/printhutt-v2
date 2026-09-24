import { Request } from 'express';

/**
 * Express 5 typings widen `req.params[key]` to `string | string[]`. In
 * practice path params are always single strings; this helper narrows safely.
 */
export const param = (req: Request, key: string): string => {
  const v = (req.params as Record<string, string | string[] | undefined>)[key];
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
};
