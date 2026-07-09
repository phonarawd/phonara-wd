/**
 * P4 Money gate E2E — Phase R wallet routes · Σ=0 conservation · §31.3 policy display.
 * Operator/CI authoritative (G13 — agent must not run autonomously).
 */
import { test, expect } from '@playwright/test';

import {
  currencyTotals,
  getPhonRealLocked,
  loginWebUser,
  primeWalletMoneyRails,
  primeWalletSessionGates,
  provisionWalletE2EFixture,
  serviceClient,
  setPhonTrackBalances,
  waitForKrwDepositFormReady,
  waitForKrwWithdrawFormReady,
  type WalletE2EFixture,
} from './fixtures/wallet-money';

test.describe('P4 wallet-d3 money gate', () => {
  let fixture: WalletE2EFixture;

  test.beforeAll(async () => {
    fixture = await provisionWalletE2EFixture();
    const admin = serviceClient();
    await primeWalletMoneyRails(admin, fixture.userId);
  });

  test.beforeEach(async ({ page }) => {
    const admin = serviceClient();
    await primeWalletMoneyRails(admin, fixture.userId);
    await loginWebUser(page, fixture);
    await primeWalletSessionGates(page);
  });

  test('§31.3 KRW deposit shows unlimited deposit policy line', async ({ page }) => {
    await page.goto('/wallet/deposit/krw');
    await expect(page.getByTestId('krw-deposit-page')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('krw-deposit-no-limit')).toBeVisible();
    await expect(page.getByTestId('krw-deposit-no-limit')).toContainText(
      /입금 한도 없음|No deposit limit/i,
    );
  });

  test('§31.3 KRW withdraw shows current and next tier limits', async ({ page }) => {
    await page.goto('/wallet/withdraw/krw');
    await expect(page.getByTestId('krw-withdraw-page')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('wallet-withdraw-tier-limits')).toBeVisible();
    await expect(page.getByTestId('wallet-withdraw-tier-limits-current')).toBeVisible();
    await expect(page.getByTestId('wallet-withdraw-tier-limits-next')).toBeVisible();
  });

  test('KRW deposit request preserves global conservation Σ=0', async ({ page }) => {
    test.setTimeout(180_000);
    const admin = serviceClient();
    const before = currencyTotals(admin);

    await page.goto('/wallet/deposit/krw');
    await waitForKrwDepositFormReady(page);
    await page.getByTestId('krw-deposit-amount-input').fill('10000');
    await expect(page.getByTestId('krw-deposit-rate-card')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('krw-deposit-submit').click();
    await expect(page.getByTestId('krw-deposit-confirm-dialog')).toBeVisible({ timeout: 15_000 });

    const depositRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_create_krw_deposit_request'),
      { timeout: 60_000 },
    );
    await page.getByTestId('krw-deposit-confirm-proceed').click();
    const response = await depositRpc;
    expect(response.status(), 'deposit RPC should succeed').toBeLessThan(400);

    await expect(page.getByTestId('krw-deposit-acknowledge')).toBeEnabled({ timeout: 15_000 });
    await page.getByTestId('krw-deposit-acknowledge').click();
    await expect(page.getByTestId('krw-deposit-success')).toBeVisible({ timeout: 15_000 });

    const after = currencyTotals(admin);
    expect(after.PHON, 'deposit request must conserve PHON Σ').toBe(before.PHON);
    expect(after.USDT, 'deposit request must conserve USDT Σ').toBe(before.USDT);
  });

  test('KRW withdraw lock preserves global conservation Σ=0', async ({ page }) => {
    test.setTimeout(180_000);
    const admin = serviceClient();
    await primeWalletMoneyRails(admin, fixture.userId);
    setPhonTrackBalances(fixture.userId, '500.000000', '1000.000000');

    const before = currencyTotals(admin);
    const realLockedBefore = getPhonRealLocked(fixture.userId);

    await page.goto('/wallet/withdraw/krw');
    await waitForKrwWithdrawFormReady(page);

    await page.getByTestId('krw-withdraw-amount-input').fill('25');
    await page.getByTestId('krw-withdraw-account-input').fill('110123456789');
    await page.getByTestId('krw-withdraw-submit').click();
    await expect(page.getByTestId('krw-withdraw-confirm-dialog')).toBeVisible({ timeout: 15_000 });

    const withdrawRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_request_withdrawal'),
      { timeout: 60_000 },
    );
    await page.getByTestId('krw-withdraw-confirm-proceed').click();
    const response = await withdrawRpc;
    expect(response.status(), 'withdrawal RPC should succeed').toBeLessThan(400);

    await expect(page.getByTestId('krw-withdraw-acknowledge')).toBeEnabled({ timeout: 15_000 });

    const after = currencyTotals(admin);
    expect(after.PHON, 'withdrawal lock must conserve PHON Σ').toBe(before.PHON);
    expect(after.USDT, 'withdrawal lock must conserve USDT Σ').toBe(before.USDT);

    const realLockedAfter = getPhonRealLocked(fixture.userId);
    expect(realLockedAfter, 'real PHON must move to phon_real_locked').toBe('25.000000');
    expect(Number(realLockedAfter)).toBeGreaterThan(Number(realLockedBefore));
  });

  test('ledger page renders read-only history surface', async ({ page }) => {
    await page.goto('/ledger');
    await expect(page.getByTestId('ledger-page')).toBeVisible({ timeout: 20_000 });
  });

  test('rewards history page renders earn ledger surface', async ({ page }) => {
    await page.goto('/rewards/history');
    await expect(page.getByTestId('rewards-history-page')).toBeVisible({ timeout: 20_000 });
  });
});
