import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const isDev = process.env.NODE_ENV === 'development';

const withPWA = withPWAInit({
  dest: "public",
  disable: isDev,
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    skipWaiting: true,
    maximumFileSizeToCacheInBytes: 5_000_000,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/s3\.ap-south-1\.amazonaws\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'product-images',
          expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cloudinary-images',
          expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/cloudify\.printhutt\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cloudify-assets',
          expiration: { maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\/(sliders|categories|subcategories|products|blogs)\/storefront/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'storefront-api',
          expiration: { maxAgeSeconds: 5 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
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

const nextConfig: NextConfig = {
  reactStrictMode: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // ✅ FIX: 7d → 30d (cache 920 KiB fix)
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

  typescript: { ignoreBuildErrors: !isDev },
  eslint: { ignoreDuringBuilds: !isDev },

  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,

  // ✅ FIX: HTTP cache headers — static assets long cache (920 KiB savings)
  async headers() {
    return [
      {
        // Next.js static files — immutable (content hash mein change = new URL)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Public folder assets (images, fonts, CSS)
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/img/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      {
        // API calls — no cache from Next.js side (backend handles this)
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/sitemap.xml` },
      { source: '/robots.txt', destination: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/robots.txt` },
    ];
  },

  experimental: {
    optimizePackageImports: [
      'react-icons',
      'lodash',
      'date-fns',
      // ✅ FIX: uuid remove — crypto.randomUUID() use kar rahe hain ab
    ],
  },

  // ✅ FIX: webpack bundle optimization — legacy JS reduce karo
  webpack(config, { isServer }) {
    if (!isServer) {
      // uuid package ko completely exclude karo (ab use nahi hota)
      config.resolve.alias = {
        ...config.resolve.alias,
        uuid: false,
      };
    }
    return config;
  },
};

export default withPWA(nextConfig);