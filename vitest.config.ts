import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: [
      "packages/**/*.test.ts",
      "packages/**/*.test.tsx",
      "tests/**/*.test.ts",
      "tests/**/*.bench.ts"
    ]
  },
  resolve: {
    alias: {
      "@crosslog/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@crosslog/platform": new URL("./packages/platform/src/index.ts", import.meta.url).pathname,
      "@crosslog/ui": new URL("./packages/ui/src/index.ts", import.meta.url).pathname
    }
  }
});

