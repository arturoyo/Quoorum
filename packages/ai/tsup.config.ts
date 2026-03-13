import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "providers/index": "src/providers/index.ts",
    "embeddings/index": "src/embeddings/index.ts",
  },
  format: ["esm"],
  dts: false, // Use tsc instead to avoid chunking issues
  splitting: false,
  treeshake: false,
  clean: true,
  sourcemap: true,
  bundle: true,
});
