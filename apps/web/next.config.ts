import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@forum/ui", "@forum/api", "@forum/core"],
};

export default nextConfig;
