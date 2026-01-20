import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/client.ts",
    "src/functions/quoorum-workers.ts",
    "src/functions/nextjs-auto-healer.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["@quoorum/db", "drizzle-orm", "inngest"],
});
