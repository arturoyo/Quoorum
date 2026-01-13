import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@quoorum/ui", "@quoorum/api", "@quoorum/core"],
};

export default nextConfig;
