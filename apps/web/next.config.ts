import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@quoorum/ui", "@quoorum/api", "@quoorum/core", "@quoorum/db", "@quoorum/quoorum", "@quoorum/workers"],

  // Ensure workspace packages are resolved correctly
  webpack: (config, { isServer }) => {
    // Add alias for better module resolution
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },

  // ⚠️ DESCOMENTAR cuando instales Sentry (ver SENTRY_SETUP.md)
  // experimental: {
  //   instrumentationHook: true,
  // },
};

export default nextConfig;
