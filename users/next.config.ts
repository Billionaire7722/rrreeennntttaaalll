import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  experimental: {},
  async rewrites() {
    const raw = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";
    const base = raw.replace(/\/+$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${base}/:path*`,
      },
    ];
  },
  webpack: (config, { dev }) => {
    config.resolve = config.resolve || {};
    config.resolve.modules = [
      path.resolve(__dirname, "node_modules"),
      ...(config.resolve.modules || []),
    ];
    if (dev) {
      // Avoid filesystem snapshot errors on Windows by using in-memory cache.
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
