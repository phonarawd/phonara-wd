import { test, expect, type Page } from '@playwright/test';

import { seedWebE2EStorage } from '../e2e/fixtures/wallet-money';

test.beforeEach(async ({ page }) => {
  await seedWebE2EStorage(page);
});

/** Wait for Phase R React boot in E2E engine mode (html marker alone is not sufficient). */
async function waitForE2eEngineBoot(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return (
        document.documentElement.dataset.e2eEngine === '1' &&
        root !== null &&
        root.childElementCount > 0
      );
    },
    { timeout: 60_000 },
  );
}

/** Guest marketing boot — `/login` avoids `/` session probe (wallet-money E2E parity). */
async function expectGuestMarketingBoot(page: Page): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await waitForE2eEngineBoot(page);
  await expect(page.getByTestId('marketing-shell')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('login-page')).toBeVisible({ timeout: 30_000 });
}

test('web app boots and renders the stub shell', async ({ page }) => {
  await expectGuestMarketingBoot(page);
});

test('PWA icon assets are reachable', async ({ page }) => {
  // vite-plugin-pwa only serves the manifest.webmanifest in production builds.
  // In dev mode, the public/ assets (icons) are always served by Vite.
  // This test verifies the critical icon files exist in public/.
  await page.goto('/');
  for (const icon of ['/pwa-192x192.png', '/pwa-512x512.png', '/apple-touch-icon-180x180.png']) {
    const resp = await page.request.get(icon);
    expect(resp.status(), `${icon} should be 200`).toBe(200);
  }
});

test('PWA service worker script is reachable (production build)', async ({ page }) => {
  const resp = await page.request.get('/sw.js');
  if (resp.status() === 404) {
    test.skip();
    return;
  }
  expect(resp.status()).toBe(200);
});

test('offline fallback page is reachable', async ({ page }) => {
  const resp = await page.request.get('/offline.html');
  expect(resp.status()).toBe(200);
  const body = await resp.text();
  expect(body).toContain('PHONARA');
});

test('guest readonly surfaces boot without auth', async ({ page }) => {
  await page.goto('/security', { waitUntil: 'domcontentloaded' });
  await waitForE2eEngineBoot(page);
  await expect(page.getByTestId('marketing-shell')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('trust-security-page')).toBeVisible({ timeout: 30_000 });
});
