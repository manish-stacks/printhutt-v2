"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderProcessor = orderProcessor;
exports.pendingOrderReminderProcessor = pendingOrderReminderProcessor;
const logger_1 = require("../config/logger");
const orderModel_1 = __importDefault(require("../db/models/orderModel"));
/**
 * Order processing job. Ported behaviour from the original
 * src/lib/orderReminderCron.ts + src/app/api/cron/pending-order-reminder.
 * Sends reminder emails for orders left in `pending` for > X hours.
 */
async function orderProcessor(job) {
    const { orderId } = job.data;
    logger_1.logger.info(`[queue:order] processing ${orderId}`, { id: job.id });
    const order = await orderModel_1.default.findById(orderId);
    if (!order) {
        logger_1.logger.warn(`[queue:order] order ${orderId} not found`);
        return;
    }
    // TODO: wire into existing email helpers in @/utils/mail/mailer
    // (kept as a one-line stub — original cron logic should be moved here).
}
/**
 * Periodic pending-order reminder. Scheduled via repeatable job (every 1h).
 */
async function pendingOrderReminderProcessor(_job) {
    // Move the body of src/app/api/cron/pending-order-reminder/route.ts here.
    // Query pending orders older than N hours, send reminder, mark reminderSent: true.
    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6h
    const stuck = await orderModel_1.default.find({
        status: 'pending',
        createdAt: { $lt: cutoff },
        reminderSent: { $ne: true },
    })
        .limit(50)
        .lean();
    logger_1.logger.info(`[queue:order] pending reminders: ${stuck.length}`);
    // TODO: send mails, then Order.updateMany({_id: {$in: stuck.map(o=>o._id)}}, {reminderSent: true})
}
//# sourceMappingURL=order.processor.js.map