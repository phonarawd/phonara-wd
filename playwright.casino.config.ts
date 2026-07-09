import { defineConfig, devices } from '@playwright/test';

import { E2E_LOW_SPEC_BASE, webDevServer } from './playwright.shared';

/**
 * Web-only E2E — Vite on 3000, no admin 3001.
 * Operator target specs: `bun run test:e2e:casino -- tests/e2e/<spec>.spec.ts`
 */
export default defineConfig({
  ...E2E_LOW_SPEC_BASE,
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts'],
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: webDevServer(),
});
