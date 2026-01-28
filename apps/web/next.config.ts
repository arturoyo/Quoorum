import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@quoorum/ui", "@quoorum/api", "@quoorum/core", "@quoorum/db", "@quoorum/quoorum", "@quoorum/workers"],

  // Reducir ruido en dev
  logging: {
    fetches: { fullUrl: false },
  },

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

  // Security headers (Best practices)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // [WARNING] DESCOMENTAR cuando instales Sentry (ver SENTRY_SETUP.md)
  // experimental: {
  //   instrumentationHook: true,
  // },
};

export default nextConfig;
