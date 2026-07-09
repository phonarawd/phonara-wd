/**
 * Admin auth funnel E2E (P3 gate · operator/CI advisory · 80 G13).
 *
 * Covers login → MFA challenge → desk access and negative auth (profiles role gate).
 * Requires local Supabase + admin dev server (port 3001).
 */
import { test, expect } from '@playwright/test';

import {
  ADMIN_BASE,
  E2E_USER_PASSWORD,
  loginAdminWithMfa,
  provisionAdminAuthFixtures,
  type AdminAuthFixtures,
} from './fixtures/admin-auth';

test.describe('Admin auth funnel', () => {
  let fixtures: AdminAuthFixtures;

  test.beforeAll(async () => {
    fixtures = await provisionAdminAuthFixtures();
  });

  test('redirects unauthenticated desk access to login', async ({ page }) => {
    await page.goto(`${ADMIN_BASE}/queues`);
    await expect(page.getByTestId('admin-login-form')).toBeVisible({ timeout: 15_000 });
  });

  test('negative: non-admin user sees admin-forbidden', async ({ page }) => {
    await page.goto(`${ADMIN_BASE}/login`);
    await expect(page.getByTestId('admin-login-form')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('admin-login-email').fill(fixtures.user.email);
    await page.getByTestId('admin-login-password').fill(E2E_USER_PASSWORD);
    await page.getByTestId('admin-login-submit').click();

    await expect(page.getByTestId('admin-forbidden')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('overview-page')).not.toBeVisible();
  });

  test('positive: admin completes MFA challenge and reaches overview', async ({ page }) => {
    await loginAdminWithMfa(page, fixtures.admin);
    await expect(page.getByTestId('admin-sidebar')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('admin-forbidden')).not.toBeVisible();
  });

  test('policy desk is reachable after MFA step-up', async ({ page }) => {
    await loginAdminWithMfa(page, fixtures.admin);
    await page.goto(`${ADMIN_BASE}/mfa/policy`);
    await expect(page.getByTestId('admin-mfa-policy-page')).toBeVisible({ timeout: 20_000 });
  });
});
