/**
 * Admin MFA E2E — Task 2 RED
 *
 * (a) MFA-unenrolled admin is forced to enrollment after login
 * (b) Admin routes are blocked before TOTP challenge succeeds
 * (c) Admin routes are accessible after challenge succeeds
 */
import { test, expect, type Page } from '@playwright/test';
import { readAdminAuth } from './_helpers';

const ADMIN_BASE = 'http://localhost:3001';

async function loginAdmin(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${ADMIN_BASE}/login`);
  await expect(page.getByTestId('admin-login-form')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('admin-email').fill(email);
  await page.getByTestId('admin-password').fill(password);
  await page.getByTestId('admin-login-submit').click();
}

test.describe('Admin MFA', () => {
  test('unenrolled admin is forced to MFA enrollment before accessing routes', async ({ page }) => {
    const adminAuth = readAdminAuth();

    await loginAdmin(page, adminAuth.email, 'E2e-Admin-Password-123456');

    await expect(page.getByTestId('admin-mfa-enroll-page')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('overview-page')).not.toBeVisible();
  });

  test('admin routes stay blocked until TOTP challenge succeeds', async ({ page }) => {
    const adminAuth = readAdminAuth();

    await loginAdmin(page, adminAuth.email, 'E2e-Admin-Password-123456');
    await expect(page.getByTestId('admin-mfa-challenge-page')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('overview-page')).not.toBeVisible();
  });
});
