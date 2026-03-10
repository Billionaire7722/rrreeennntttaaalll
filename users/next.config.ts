import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  experimental: {},
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
