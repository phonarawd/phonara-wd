/**
 * Shared Playwright settings for low-spec Windows — single source for all E2E configs.
 * Phase D: tests/e2e demolished — global setup/teardown removed (Batch 9½).
 */
import type { PlaywrightTestConfig } from '@playwright/test';

/** Local Supabase demo anon JWT (`supabase start` default stack). */
export const LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';

/** Low-spec baseline — every config must keep workers:1. */
export const E2E_LOW_SPEC_BASE = {
  outputDir: 'test-results',
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
} as const satisfies Partial<PlaywrightTestConfig>;

export type LocalWebServerEnv = Record<string, string>;

/** Pin web/admin dev servers to local stack; disable guest bypass in E2E. */
export function localWebServerEnv(overrides: LocalWebServerEnv = {}): LocalWebServerEnv {
  return {
    VITE_SUPABASE_URL: process.env['VITE_SUPABASE_URL'] ?? LOCAL_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env['VITE_SUPABASE_ANON_KEY'] ?? LOCAL_ANON_KEY,
    VITE_PHONARA_E2E_ENGINE: '1',
    VITE_PHONARA_DEV_GUEST: '0',
    // Prevent first-visit AdsConsentSheet from Radix body scroll-lock in headless CI.
    VITE_TIKTOK_PIXEL_ID: '',
    VITE_META_PIXEL_ID: '',
    VITE_GOOGLE_TAG_ID: '',
    ...overrides,
  };
}

export interface WebDevServerOptions {
  port?: number;
  env?: LocalWebServerEnv;
  timeoutMs?: number;
}

/** Single Vite dev server — casino/m0/visual use web-only (no admin 3001). */
export function webDevServer(options: WebDevServerOptions = {}) {
  const port = options.port ?? 3000;
  return {
    command: `tsx scripts/e2e-dev-server.ts web ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false as const,
    timeout: options.timeoutMs ?? 120_000,
    env: localWebServerEnv(options.env),
  };
}

export interface AdminDevServerOptions {
  port?: number;
  timeoutMs?: number;
}

export function adminDevServer(options: AdminDevServerOptions = {}) {
  const port = options.port ?? 3001;
  return {
    command: `tsx scripts/e2e-dev-server.ts admin ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false as const,
    timeout: options.timeoutMs ?? 120_000,
    env: localWebServerEnv(),
  };
}
