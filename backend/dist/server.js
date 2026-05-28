"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const connection_1 = require("./db/connection");
const client_1 = require("./redis/client");
async function bootstrap() {
    await (0, connection_1.connectDB)();
    // warm Redis connection
    (0, client_1.redisClient)();
    const app = (0, app_1.buildApp)();
    const server = app.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`🚀 API listening on port ${env_1.env.PORT} (env=${env_1.env.NODE_ENV})`);
    });
    const shutdown = (sig) => {
        logger_1.logger.info(`Received ${sig}, shutting down...`);
        server.close(() => {
            logger_1.logger.info('HTTP server closed');
            process.exit(0);
        });
        // hard exit after 10s
        setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error('Unhandled rejection', reason);
    });
}
bootstrap().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map