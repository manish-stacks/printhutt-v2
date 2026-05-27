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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "cloudify.printhutt.com",
      },{
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: !isDev ? true : false,
  },
  eslint: {
    ignoreDuringBuilds: !isDev ? true : false,
  },
  productionBrowserSourceMaps: true,
  compress: true,
  poweredByHeader: false,
});

export default nextConfig;
