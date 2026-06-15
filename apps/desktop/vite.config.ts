import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
  },
  resolve: {
    alias: [
      {
        find: /^@crosslog\/core$/,
        replacement: new URL("../../packages/core/src/index.ts", import.meta.url).pathname,
      },
      {
        find: /^@crosslog\/core\/(.*)$/,
        replacement: new URL("../../packages/core/src/$1", import.meta.url).pathname,
      },
      {
        find: /^@crosslog\/platform$/,
        replacement: new URL("../../packages/platform/src/index.ts", import.meta.url).pathname,
      },
      {
        find: /^@crosslog\/platform\/(.*)$/,
        replacement: new URL("../../packages/platform/src/$1", import.meta.url).pathname,
      },
      {
        find: /^@crosslog\/ui$/,
        replacement: new URL("../../packages/ui/src/index.ts", import.meta.url).pathname,
      },
      {
        find: /^@crosslog\/ui\/(.*)$/,
        replacement: new URL("../../packages/ui/src/$1", import.meta.url).pathname,
      },
    ],
  },
});
