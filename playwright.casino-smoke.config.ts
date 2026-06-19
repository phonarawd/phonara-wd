import { defineConfig, devices } from '@playwright/test';

const LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/casino-preview-smoke.spec.ts'],
  outputDir: 'test-results',
  timeout: 45_000,
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL: 'http://127.0.0.1:3002',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'tsx scripts/e2e-preview-server.ts web 3002',
    url: 'http://127.0.0.1:3002',
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54444',
      VITE_SUPABASE_ANON_KEY: LOCAL_ANON_KEY,
    },
  },
});
