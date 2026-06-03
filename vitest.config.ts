import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "libs/shared/src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["reflect-metadata"],
    include: ["apps/**/*.spec.ts", "libs/**/*.spec.ts"],
  },
});
