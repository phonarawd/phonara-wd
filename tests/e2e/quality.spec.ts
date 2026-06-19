import { expect, test, type Page } from '@playwright/test';
import { injectBrowserSession, readAuth } from './_helpers';

async function expectNamedButtons(page: Page): Promise<void> {
  const unnamedButtons = await page.locator('button').evaluateAll((buttons) =>
    buttons.filter((button) => {
      const text = (button.textContent ?? '').replace(/\s+/g, ' ').trim();
      const aria = button.getAttribute('aria-label')?.trim() ?? '';
      const title = button.getAttribute('title')?.trim() ?? '';
      return text.length === 0 && aria.length === 0 && title.length === 0;
    }).length,
  );
  expect(unnamedButtons, 'every button must have visible text or an accessible name').toBe(0);
}

test('PWA and accessibility smoke: install metadata, offline fallback, named controls', async ({
  page,
}) => {
  test.setTimeout(90_000);

  await page.goto('/login');
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    'content',
    /viewport-fit=cover/,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    /apple-touch-icon/,
  );
  await expect(page.locator('a.skip-link[href="#main-content"]')).toBeAttached();
  await expectNamedButtons(page);

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );

  const offline = await page.request.get('/offline.html');
  expect(offline.ok(), 'offline fallback should be served').toBe(true);
  const offlineBody = await offline.text();
  expect(offlineBody).toContain('phonara.locale');
  expect(offlineBody).not.toContain('#6366f1');

  const manifestRes = await page.request.get('/manifest.webmanifest');
  expect(manifestRes.ok(), 'manifest should be served').toBe(true);
  const manifest = (await manifestRes.json()) as { shortcuts?: Array<{ url?: string }> };
  expect(manifest.shortcuts?.map((shortcut) => shortcut.url)).toEqual(
    expect.arrayContaining(['/trade', '/wallet', '/casino']),
  );

  const auth = readAuth();
  await injectBrowserSession(page, auth.accessToken, auth.refreshToken, {
    postLoginPath: '/home',
  });
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('referral-dashboard')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#main-content')).toBeVisible();
  await expectNamedButtons(page);
});
