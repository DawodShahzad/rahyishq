import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Hide dev indicators floating badge */
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon/favicon.ico',
      },
      {
        source: '/site.webmanifest',
        destination: '/favicon/site.webmanifest',
      },
    ];
  },
};

export default nextConfig;
