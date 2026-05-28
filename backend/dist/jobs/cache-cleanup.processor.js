"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheCleanupProcessor = cacheCleanupProcessor;
const logger_1 = require("../config/logger");
const client_1 = require("../redis/client");
async function cacheCleanupProcessor(job) {
    const { pattern } = job.data;
    logger_1.logger.info(`[queue:cache-cleanup] clearing ${pattern}`);
    await (0, client_1.cacheDelPattern)(pattern);
}
//# sourceMappingURL=cache-cleanup.processor.js.map