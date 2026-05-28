"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tick = tick;
/** Ports src/app/api/visitors/route.ts (active-visitor counter). */
const visitors_repository_1 = require("./visitors.repository");
async function tick(ip, userAgent) {
    const now = new Date();
    await visitors_repository_1.visitorsRepo.upsert(ip, userAgent, now);
    const oneMinAgo = new Date(Date.now() - 60 * 1000);
    await visitors_repository_1.visitorsRepo.removeStale(oneMinAgo);
    const count = await visitors_repository_1.visitorsRepo.countActive(oneMinAgo);
    return { count };
}
//# sourceMappingURL=visitors.service.js.map