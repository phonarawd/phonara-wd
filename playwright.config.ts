import { defineConfig, devices } from '@playwright/test';
import { adminDevServer, E2E_LOW_SPEC_BASE, webDevServer } from './playwright.shared';

/** Phase R — smoke by default; full e2e when run via `bun run test:e2e` (PHONARA_E2E_ACTIVE=1). */
const includeFullE2E = process.env.PHONARA_E2E_ACTIVE === '1';

export default defineConfig({
  ...E2E_LOW_SPEC_BASE,
  testDir: './tests',
  testMatch: includeFullE2E ? ['e2e/**/*.spec.ts', 'smoke/**/*.spec.ts'] : ['smoke/**/*.spec.ts'],
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
  webServer: includeFullE2E ? [webDevServer(), adminDevServer()] : webDevServer(),
});
