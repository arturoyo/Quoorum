import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/components/index.ts", "src/hooks/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "@quoorum/api"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
