/**
 * Browser signup + password login against the local Supabase stack.
 * Guards the manual dev path (not only service-role E2E fixtures).
 */
import { test, expect } from '@playwright/test';

test('auth entry: signup then login reaches dashboard', async ({ page }) => {
  const email = `ui_auth_${Date.now()}@phonara.local`;
  const password = 'Ui-Auth-Password-123456';

  await page.goto('/signup');
  await expect(page.locator('input#signup-email')).toBeVisible({ timeout: 15_000 });
  await page.locator('input#signup-email').fill(email);
  await page.locator('input#signup-password').fill(password);
  await page.locator('input#signup-confirm').fill(password);
  await page.getByRole('button', { name: /계정 만들기|Create account/i }).click();

  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 20_000 });

  await page.waitForFunction(() =>
    Boolean((window as unknown as { __supabase?: unknown }).__supabase),
  );
  await page.evaluate(async () => {
    const sb = (window as unknown as { __supabase: { auth: { signOut: () => Promise<void> } } }).__supabase;
    await sb.auth.signOut();
  });

  await page.goto('/login');
  await expect(page.locator('input#login-email')).toBeVisible({ timeout: 15_000 });
  await page.locator('input#login-email').fill(email);
  await page.locator('input#login-password').fill(password);
  await page.locator('form button[type="submit"]').click();

  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 20_000 });
});
