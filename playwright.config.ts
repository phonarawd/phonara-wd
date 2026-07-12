import { defineConfig, devices } from '@playwright/test';
import { adminDevServer, E2E_LOW_SPEC_BASE, webDevServer } from './playwright.shared';

/** Phase R — smoke by default; full e2e when run via `bun run test:e2e` (PHONARA_E2E_ACTIVE=1). */
const includeFullE2E = process.env.PHONARA_E2E_ACTIVE === '1';
const chromiumDesktop = { ...devices['Desktop Chrome'] };

export default defineConfig({
  ...E2E_LOW_SPEC_BASE,
  testDir: './tests',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: includeFullE2E
    ? [
        {
          name: 'smoke',
          testMatch: 'smoke/**/*.spec.ts',
          use: chromiumDesktop,
        },
        {
          name: 'e2e',
          testMatch: 'e2e/**/*.spec.ts',
          use: chromiumDesktop,
          dependencies: ['smoke'],
        },
      ]
    : [
        {
          name: 'chromium',
          testMatch: 'smoke/**/*.spec.ts',
          use: chromiumDesktop,
        },
      ],
  webServer: includeFullE2E ? [webDevServer(), adminDevServer()] : webDevServer(),
});
