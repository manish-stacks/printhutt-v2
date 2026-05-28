import { Router } from 'express';
import * as controller from './seo.controller';

const router = Router();
router.get('/sitemap.xml', controller.sitemap);
router.get('/robots.txt', controller.robots);
export default router;