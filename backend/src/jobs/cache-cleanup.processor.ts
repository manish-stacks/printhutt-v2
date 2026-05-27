import { Job } from 'bullmq';
import { logger } from '../config/logger';
import { cacheDelPattern } from '../redis/client';

export async function cacheCleanupProcessor(job: Job<{ pattern: string }>): Promise<void> {
  const { pattern } = job.data;
  logger.info(`[queue:cache-cleanup] clearing ${pattern}`);
  await cacheDelPattern(pattern);
}
