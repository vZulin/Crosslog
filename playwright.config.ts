import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "apps/web/tests/ui",
  // Wall-clock scroll probes need predictable CPU availability on shared CI runners.
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry"
  },
  webServer: {
    command:
      "corepack pnpm --filter @crosslog/web build && corepack pnpm --filter @crosslog/web preview --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
