/** Ports src/app/api/visitors/route.ts (active-visitor counter). */
import { visitorsRepo } from './visitors.repository';

export async function tick(ip: string, userAgent: string): Promise<{ count: number }> {
  const now = new Date();
  await visitorsRepo.upsert(ip, userAgent, now);
  const oneMinAgo = new Date(Date.now() - 60 * 1000);
  await visitorsRepo.removeStale(oneMinAgo);
  const count = await visitorsRepo.countActive(oneMinAgo);
  return { count };
}
