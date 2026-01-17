import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@quoorum/ui", "@quoorum/api", "@quoorum/core", "@quoorum/db", "@quoorum/quoorum"],
};

export default nextConfig;
