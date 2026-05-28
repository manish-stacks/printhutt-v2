import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import * as service from './seo.service';

export const sitemap = asyncHandler(async (_req: Request, res: Response) => {
  const xml = await service.generateSitemap();
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.send(xml);
});

export const robots = asyncHandler(async (_req: Request, res: Response) => {
  const txt = await service.generateRobots();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.send(txt);
});