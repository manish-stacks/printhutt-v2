import 'express-async-errors';
import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDB } from './db/connection';
import { redisClient } from './redis/client';

async function bootstrap(): Promise<void> {
  await connectDB();
  // warm Redis connection
  redisClient();

  const app = buildApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 API listening on port ${env.PORT} (env=${env.NODE_ENV})`);
  });

  const shutdown = (sig: string): void => {
    logger.info(`Received ${sig}, shutting down...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // hard exit after 10s
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', reason);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});
