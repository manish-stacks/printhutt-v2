import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const isDev = process.env.NODE_ENV === 'development';

/* ─── PWA wrapper ─── */
const withPWA = withPWAInit({
  dest: "public",
  disable: isDev,
  register: true,
  cacheOnFrontEndNav: true,           // cache pages on client navigation
  aggressiveFrontEndNavCaching: true, // more aggressive caching
  reloadOnOnline: true,               // auto-refresh when back online

  workboxOptions: {
    skipWaiting: true,
    maximumFileSizeToCacheInBytes: 5_000_000, // 2.5MB — JS/CSS shell only
    runtimeCaching: [
      // Product images from S3 — cache 30 days
      {
        urlPattern: /^https:\/\/s3\.ap-south-1\.amazonaws\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'product-images',
          expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Cloudinary images
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cloudinary-images',
          expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Storefront API responses — cache 5 min (stale-while-revalidate)
      {
        urlPattern: /\/(sliders|categories|subcategories|products|blogs)\/storefront/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'storefront-api',
          expiration: { maxAgeSeconds: 5 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Fonts
      {
        urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-fonts',
          expiration: { maxEntries: 16, maxAgeSeconds: 60 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

/* ─── Next.js config ─── */
const nextConfig: NextConfig = {
  reactStrictMode: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "s3.ap-south-1.amazonaws.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "cloudify.printhutt.com" },
      { protocol: "https", hostname: "cdn-icons-png.flaticon.com" },
    ],
  },

  typescript: {
    ignoreBuildErrors: !isDev,
  },
  eslint: {
    ignoreDuringBuilds: !isDev,
  },

  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,

  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/sitemap.xml` },
      { source: '/robots.txt', destination: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/robots.txt` },
    ];
  },

  experimental: {
    optimizePackageImports: ['react-icons', 'lodash', 'date-fns'],
    // missingSuspenseWithCSRBailout: false,
  },
};

export default withPWA(nextConfig);