import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import * as controller from './messaging.controller';

const router = Router();

// All routes admin-only
router.use(...requireAdmin);

// Manual send
router.post('/send', controller.sendManual);

// Logs
router.get('/logs/user/:userId', controller.getUserLogs);
router.get('/logs', controller.listLogs);

// Templates
// router.get('/templates', controller.listTemplates);
// router.post('/templates', controller.createTemplate);
// router.put('/templates/:id', controller.updateTemplate);
// router.delete('/templates/:id', controller.deleteTemplate);

// Manual trigger (for testing)
router.post('/trigger/order-pending', controller.triggerOrderPending);
router.post('/trigger/wishlist-abandoned', controller.triggerWishlistAbandoned);

export default router;