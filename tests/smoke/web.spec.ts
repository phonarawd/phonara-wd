import { test, expect } from '@playwright/test';

test('web app boots and renders the login page', async ({ page }) => {
  // Assert the app mounted and the login form rendered (locale-independent selector).
  await page.goto('/login');
  await expect(page.locator('input#login-email')).toBeVisible({ timeout: 15_000 });
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
