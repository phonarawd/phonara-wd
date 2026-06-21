import { test, expect } from '@playwright/test';

/**
 * L1-16c regression — /home must not stack AppShell + HomeShellFrame mobile chrome.
 */
test.describe('Home mobile chrome — no duplicate header', () => {
  test.use({ viewport: { width: 390, height: 812 } });

  test('guest /home shows one header row and one online pill', async ({ page }) => {
    await page.goto('/home');

    await expect(page.getByTestId('home-mobile-header')).toBeVisible();
    await expect(page.getByTestId('home-mobile-online-bar')).toBeVisible();
    await expect(page.getByTestId('app-shell-topbar')).toBeHidden();
    await expect(page.getByTestId('social-proof-strip')).toBeHidden();
    await expect(
      page.getByTestId('home-mobile-header').getByText(/시스템 정상|System Normal/),
    ).toBeVisible();
  });
});
