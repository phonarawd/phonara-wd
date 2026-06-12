/**
 * Admin MFA E2E — Task 2
 */
import { test, expect } from '@playwright/test';
import { generateSync } from 'otplib';
import {
  readAdminAuth,
  adminClient,
  loginAdmin,
} from './_helpers';

const ADMIN_BASE = 'http://localhost:3001';

test.describe('Admin MFA', () => {
  test('unenrolled admin is forced to MFA enrollment before accessing routes', async ({ page }) => {
    const dbAdmin = adminClient();
    const email = `e2e_mfa_fresh_${Date.now()}@phonara.local`;
    const password = 'E2e-Admin-Password-123456';

    const { data: created, error: createErr } = await dbAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? 'createUser failed');

    await dbAdmin.from('profiles').update({ role: 'admin' }).eq('id', created.user.id);

    await page.goto(`${ADMIN_BASE}/login`);
    await expect(page.getByTestId('admin-login-form')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('admin-email').fill(email);
    await page.getByTestId('admin-password').fill(password);
    await page.getByTestId('admin-login-submit').click();

    await expect(page.getByTestId('admin-mfa-enroll-page')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('overview-page')).not.toBeVisible();
  });

  test('admin routes stay blocked until TOTP challenge succeeds', async ({ page }) => {
    const adminAuth = readAdminAuth();

    await page.goto(`${ADMIN_BASE}/login`);
    await expect(page.getByTestId('admin-login-form')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('admin-email').fill(adminAuth.email);
    await page.getByTestId('admin-password').fill('E2e-Admin-Password-123456');
    await page.getByTestId('admin-login-submit').click();

    await expect(page.getByTestId('admin-mfa-challenge-page')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('overview-page')).not.toBeVisible();

    const code = generateSync({ secret: adminAuth.totpSecret! });
    await page.getByTestId('admin-mfa-challenge-code').fill(code);
    await page.getByTestId('admin-mfa-challenge-submit').click();

    await expect(page.getByTestId('overview-page')).toBeVisible({ timeout: 20_000 });
  });

  test('enrolled admin with MFA completes full login path', async ({ page }) => {
    const adminAuth = readAdminAuth();
    await loginAdmin(page, adminAuth.email, 'E2e-Admin-Password-123456', adminAuth.totpSecret);
    await expect(page.getByTestId('overview-page')).toBeVisible({ timeout: 20_000 });
  });
});
