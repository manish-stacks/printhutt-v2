"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("./env");
const { combine, timestamp, printf, colorize, errors, json } = winston_1.default.format;
const devFormat = printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} [${level}] ${stack || message}`;
});
exports.logger = winston_1.default.createLogger({
    level: env_1.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: env_1.env.NODE_ENV === 'production'
        ? combine(timestamp(), errors({ stack: true }), json())
        : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), devFormat),
    transports: [new winston_1.default.transports.Console()],
});
//# sourceMappingURL=logger.js.map