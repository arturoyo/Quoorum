import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "lib/system-logger": "src/lib/system-logger.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    "@quoorum/ai",
    "@quoorum/core",
    "@quoorum/db",
    "@quoorum/db/schema",
    "@quoorum/quoorum",
    "@quoorum/quoorum/integrations/google-search",
    "@quoorum/quoorum/integrations/serper",
    "@quoorum/quoorum/integrations/pinecone",
    "@quoorum/quoorum/integrations/redis",
    "@quoorum/quoorum/integrations/messaging",
    "@quoorum/workers",
    "drizzle-orm",
  ],
});
