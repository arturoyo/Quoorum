import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@quoorum/ui", "@quoorum/api", "@quoorum/core"],
  // Skip static generation for certain routes
  experimental: {
    skipMiddlewareUrlNormalize: false,
    skipTrailingSlashRedirect: false,
  },
};

export default nextConfig;
