import { defineConfig, devices } from "@playwright/test";

// By default runs against the production build (run `pnpm build` first): the setup
// most likely to differ from dev (assembled remote path, SPA fallback, hashed chunks).
// E2E_BASE_URL=http://localhost:3000 runs the same suite against a running `pnpm dev`.
const externalBaseUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: externalBaseUrl ?? "http://localhost:4173", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: externalBaseUrl
    ? undefined
    : { command: "pnpm preview", url: "http://localhost:4173", reuseExistingServer: !process.env.CI },
});
