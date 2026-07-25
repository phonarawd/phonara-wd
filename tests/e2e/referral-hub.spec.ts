/**
 * Referral hub E2E — code surface · invite CTA · copy controls.
 * Operator/CI authoritative (G13 — agent must not run autonomously).
 *
 * Target: `bun run test:e2e:casino -- tests/e2e/referral-hub.spec.ts`
 */
import { test, expect } from '@playwright/test';

import {
  loginWebUser,
  primeWalletMoneyRails,
  provisionWalletE2EFixture,
  serviceClient,
  type WalletE2EFixture,
} from './fixtures/wallet-money';

test.describe('referral hub surface gate', () => {
  let fixture: WalletE2EFixture;

  test.beforeAll(async () => {
    fixture = await provisionWalletE2EFixture();
    const admin = serviceClient();
    await primeWalletMoneyRails(admin, fixture.userId);
    await admin
      .from('app_config')
      .update({ value: 'false' })
      .in('key', ['system_halt', 'system_readonly', 'consent_gate_enabled']);
  });

  test.beforeEach(async ({ page }) => {
    await loginWebUser(page, fixture);
  });

  test('referral hub shows code card and invite CTA', async ({ page }) => {
    await page.goto('/referral', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('referral-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('referral-page-loading')).toHaveCount(0, { timeout: 60_000 });
    await expect(page.getByTestId('referral-code-card')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('referral-code-value')).toBeVisible();
    await expect(page.getByTestId('referral-code-value')).not.toHaveText('', { timeout: 15_000 });
    await expect(page.getByTestId('referral-invite-cta')).toBeVisible();
    await expect(page.getByTestId('referral-leaderboard-cta')).toBeVisible();
  });

  test('copy code / copy link controls are enabled', async ({ page }) => {
    await page.goto('/referral', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('referral-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('referral-copy-code')).toBeEnabled({ timeout: 30_000 });
    await expect(page.getByTestId('referral-copy-link')).toBeEnabled({ timeout: 30_000 });
  });

  test('invite CTA navigates to invite route', async ({ page }) => {
    await page.goto('/referral', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('referral-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('referral-page-loading')).toHaveCount(0, { timeout: 60_000 });
    await expect(page.getByTestId('referral-invite-cta')).toBeVisible();
    await page.getByTestId('referral-invite-cta').click();
    await expect(page).toHaveURL(/\/referral\/invite/, { timeout: 30_000 });
  });
});
