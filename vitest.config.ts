import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx"],
    exclude: ["node_modules", "dist", ".turbo"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", "dist", "**/*.d.ts", "**/*.test.ts"],
    },
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@quoorum/ai": path.resolve(__dirname, "./packages/ai/src"),
      "@quoorum/api": path.resolve(__dirname, "./packages/api/src"),
      "@quoorum/core": path.resolve(__dirname, "./packages/core/src"),
      "@quoorum/db": path.resolve(__dirname, "./packages/db/src"),
      "@quoorum/quoorum": path.resolve(__dirname, "./packages/quoorum/src"),
    },
  },
});
