"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
mongoose_1.default.set('strictQuery', true);
let isConnected = false;
async function connectDB() {
    if (isConnected)
        return mongoose_1.default;
    try {
        await mongoose_1.default.connect(env_1.env.MONGO_URL, {
            bufferCommands: false,
        });
        isConnected = true;
        logger_1.logger.info('MongoDB connected');
        return mongoose_1.default;
    }
    catch (err) {
        logger_1.logger.error('MongoDB connection error', err);
        throw err;
    }
}
async function disconnectDB() {
    if (!isConnected)
        return;
    await mongoose_1.default.disconnect();
    isConnected = false;
}
//# sourceMappingURL=connection.js.map