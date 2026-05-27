import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import * as controller from './dashboard.controller';
const router = Router();
router.get('/', ...requireAdmin, controller.overview);
export default router;
