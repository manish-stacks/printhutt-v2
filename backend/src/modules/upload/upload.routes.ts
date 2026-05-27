import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import * as controller from './upload.controller';
const router = Router();
router.get('/signed-url', ...requireAdmin, controller.getSignedUrl);
export default router;
