import { Router } from 'express';
import * as controller from './visitors.controller';
const router = Router();
router.get('/', controller.tick);
export default router;
