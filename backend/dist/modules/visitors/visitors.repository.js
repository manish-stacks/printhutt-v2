"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitorsRepo = void 0;
const visitorModel_1 = __importDefault(require("@/db/models/visitorModel"));
exports.visitorsRepo = {
    upsert: (ip, userAgent, now) => visitorModel_1.default.findOneAndUpdate({ ip }, { lastSeen: now, userAgent }, { upsert: true, new: true }),
    removeStale: (before) => visitorModel_1.default.deleteMany({ lastSeen: { $lt: before } }),
    countActive: (after) => visitorModel_1.default.countDocuments({ lastSeen: { $gte: after } }),
};
//# sourceMappingURL=visitors.repository.js.map