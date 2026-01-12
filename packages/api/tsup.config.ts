import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["@quoorum/ai", "@quoorum/core", "@quoorum/db", "@quoorum/forum", "drizzle-orm"],
});
