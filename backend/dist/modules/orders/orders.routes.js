"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const validate_middleware_1 = require("@/middlewares/validate.middleware");
const controller = __importStar(require("./orders.controller"));
const orders_validation_1 = require("./orders.validation");
const router = (0, express_1.Router)();
/* Original: GET /api/order   (admin sees non-pending unless filtered;
   regular users see only their own orders) */
router.get('/', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(orders_validation_1.listOrdersQuerySchema, 'query'), controller.list);
/* Original: POST /api/order */
router.post('/', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(orders_validation_1.createOrderSchema), controller.createOrder);
/* Original: PATCH /api/order/[id]/shipping */
router.patch('/:id/shipping', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(orders_validation_1.updateOrderShippingSchema), controller.updateShipping);
/* Original: PATCH /api/order/[id]/status   (admin-only side-effects) */
router.patch('/:id/status', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(orders_validation_1.updateOrderStatusSchema), controller.updateStatus);
/* Original: GET /api/order/[id]/pending  (pending-nav variant) */
router.get('/:id/pending', auth_middleware_1.requireAuth, controller.byIdPending);
/* Original: DELETE /api/order/[id]/pending */
router.delete('/:id/pending', auth_middleware_1.requireAuth, controller.deleteOrder);
/* Original: GET /api/order/[id] */
router.get('/:id', auth_middleware_1.requireAuth, controller.byId);
/* Original: DELETE /api/order/[id] */
router.delete('/:id', auth_middleware_1.requireAuth, controller.deleteOrder);
exports.default = router;
//# sourceMappingURL=orders.routes.js.map