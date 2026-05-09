import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // The mock API server in globalSetup keeps mutable in-memory state.
  // Running browser projects in parallel makes create/delete flows nondeterministic.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  workers: 1,
  globalSetup: "./e2e/globalSetup.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "1",
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:4001",
      NEXT_PUBLIC_E2E_BYPASS_AUTH: "true",
    },
  },
});
