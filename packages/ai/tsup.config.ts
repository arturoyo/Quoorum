import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/providers/index.ts", "src/embeddings/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
