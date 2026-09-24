import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import * as service from './visitors.service';

export const tick = asyncHandler(async (req: Request, res: Response) => {
  const fwd = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0];
  const real = req.headers['x-real-ip'] as string | undefined;
  const ip = (fwd ?? real ?? req.ip ?? 'unknown').trim();
  const userAgent = (req.headers['user-agent'] as string | undefined) ?? '';
  try {
    const data = await service.tick(ip, userAgent);
    return res.json(data);
  } catch {
    return res.status(500).json({ count: 0 });
  }
});
