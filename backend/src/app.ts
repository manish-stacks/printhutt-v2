import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { globalLimiter } from './middlewares/rate-limit.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { logger } from './config/logger';

// All 24 module routers
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import categoryRoutes from './modules/categories/categories.routes';
import subcategoryRoutes from './modules/subcategories/subcategories.routes';
import productRoutes from './modules/products/products.routes';
import cartRoutes from './modules/cart/cart.routes';
import wishlistRoutes from './modules/wishlist/wishlist.routes';
import addressRoutes from './modules/addresses/addresses.routes';
import couponRoutes from './modules/coupons/coupons.routes';
import orderRoutes from './modules/orders/orders.routes';
import reviewRoutes from './modules/reviews/reviews.routes';
import offerRoutes from './modules/offers/offers.routes';
import sliderRoutes from './modules/sliders/sliders.routes';
import testimonialRoutes from './modules/testimonials/testimonials.routes';
import blogRoutes from './modules/blogs/blogs.routes';
import blogCategoryRoutes from './modules/blog-categories/blog-categories.routes';
import warrantyRoutes from './modules/warranty/warranty.routes';
import returnPolicyRoutes from './modules/return-policy/return-policy.routes';
import shippingRoutes from './modules/shipping/shipping.routes';
import personalizedGiftsRoutes from './modules/personalized-gifts/personalized-gifts.routes';
import visitorsRoutes from './modules/visitors/visitors.routes';
import uploadRoutes from './modules/upload/upload.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import paymentRoutes from './modules/payment/payment.routes';

export function buildApp(): Express {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()), credentials: true }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(compression());

  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.originalUrl}`);
    next();
  });

  app.use('/api/', globalLimiter);

  app.get('/health', (_req, res) => res.json({ ok: true, service: env.APP_NAME }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/subcategories', subcategoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/addresses', addressRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/offers', offerRoutes);
  app.use('/api/sliders', sliderRoutes);
  app.use('/api/testimonials', testimonialRoutes);
  app.use('/api/blogs', blogRoutes);
  app.use('/api/blog-categories', blogCategoryRoutes);
  app.use('/api/warranty', warrantyRoutes);
  app.use('/api/return-policy', returnPolicyRoutes);
  app.use('/api/shipping', shippingRoutes);
  app.use('/api/personalized-gifts', personalizedGiftsRoutes);
  app.use('/api/visitors', visitorsRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/payment', paymentRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
