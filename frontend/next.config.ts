import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = withPWA({
  dest: "public",
  disable: isDev,
  register: true,
  skipWaiting: true,
  maximumFileSizeToCacheInBytes: 5000000,
})({
  reactStrictMode: false,

  images: {
    formats: ['image/avif', 'image/webp'],          // ← NEW: serve AVIF first, WebP fallback
    minimumCacheTTL: 60 * 60 * 24 * 7,              // ← NEW: 7-day cache on optimized images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // ← NEW: trim oversized variants
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
    ignoreBuildErrors: !isDev ? true : false,
  },
  eslint: {
    ignoreDuringBuilds: !isDev ? true : false,
  },

  // ← CHANGED: production source maps were a 3-5MB extra payload per page
  productionBrowserSourceMaps: false,

  compress: true,
  poweredByHeader: false,

  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/sitemap.xml` },
      { source: '/robots.txt', destination: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/robots.txt` },
    ];
  },

  // ← NEW: tree-shake heavy icon library imports
  experimental: {
    optimizePackageImports: ['react-icons', 'lodash', 'date-fns'],
  },
});

export default nextConfig;