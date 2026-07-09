import { defineConfig, devices } from '@playwright/test';

import {
  TRADE_DESK_BROWSER_MATRIX_GREP,
  TRADE_DESK_BROWSER_MATRIX_PROJECTS,
  TRADE_DESK_BROWSER_MATRIX_SPEC,
} from './apps/web/src/domain/trade-desk-browser-matrix-display-contract';
import { E2E_LOW_SPEC_BASE, webDevServer } from './playwright.shared';

/**
 * P3-D — trade-desk-smoke subset on firefox + webkit (Safari engine).
 * Chromium authoritative gate remains `playwright.config.ts` + full `test:e2e`.
 * CI optional job: `.github/workflows/ci.yml` → `e2e-browser-matrix` (advisory).
 */
export default defineConfig({
  ...E2E_LOW_SPEC_BASE,
  testDir: './tests',
  testMatch: [TRADE_DESK_BROWSER_MATRIX_SPEC.replace(/^tests\//, '')],
  grep: TRADE_DESK_BROWSER_MATRIX_GREP,
  timeout: 90_000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: TRADE_DESK_BROWSER_MATRIX_PROJECTS.map((name) => ({
    name,
    use: { ...devices[name === 'firefox' ? 'Desktop Firefox' : 'Desktop Safari'] },
  })),
  webServer: webDevServer(),
});
