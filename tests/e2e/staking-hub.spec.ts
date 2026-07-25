/**
 * Staking hub E2E — PHON stake wizard · Σ=0.
 * Operator/CI authoritative (G13 — agent must not run autonomously).
 *
 * Target: `bun run test:e2e:casino -- tests/e2e/staking-hub.spec.ts`
 */
import { test, expect } from '@playwright/test';

import {
  currencyTotals,
  getLatestStakingPositionId,
  gotoStakingHub,
  prepareTradeDeskSession,
  provisionTradeDeskE2EFixture,
  serviceClient,
  type TradeDeskE2EFixture,
} from './fixtures/trade-desk-money';

test.describe('staking hub money gate', () => {
  let fixture: TradeDeskE2EFixture;

  test.beforeAll(async () => {
    fixture = await provisionTradeDeskE2EFixture();
  });

  test.beforeEach(async ({ page }) => {
    await prepareTradeDeskSession(page, fixture);
  });

  test('staking hub wizard mounts', async ({ page }) => {
    await gotoStakingHub(page);
    await expect(page.getByTestId('staking-stake-wizard')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('staking-stake-currency-phon')).toBeVisible({ timeout: 30_000 });
  });

  test('stake PHON via hub wizard preserves Σ=0', async ({ page }) => {
    test.setTimeout(180_000);
    const admin = serviceClient();
    const before = currencyTotals(admin);

    await gotoStakingHub(page);

    await page.getByTestId('staking-stake-currency-phon').click();
    const phonPool = page.locator('[data-testid^="staking-pool-"]').first();
    await expect(phonPool).toBeVisible({ timeout: 20_000 });
    await phonPool.click();
    await page.getByTestId('staking-wizard-next').click();

    await page.getByTestId('staking-amount-input').fill('100');
    await page.getByTestId('staking-wizard-next').click();

    const stakeRpc = page.waitForResponse(
      (resp) =>
        resp.url().includes('/rest/v1/rpc/rpc_stake_phon') ||
        resp.url().includes('/rest/v1/rpc/rpc_stake'),
      { timeout: 60_000 },
    );
    await page.getByTestId('staking-stake-cta').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /진행|Proceed|확인|Confirm/i })
      .click();
    const response = await stakeRpc;
    expect(response.status(), 'stake RPC should succeed').toBeLessThan(400);

    const positionId = await getLatestStakingPositionId(admin, fixture.userId);
    expect(positionId, 'staking position created').toBeTruthy();

    const after = currencyTotals(admin);
    expect(after.PHON, 'stake must conserve PHON Σ').toBe(before.PHON);
    expect(after.USDT, 'stake must conserve USDT Σ').toBe(before.USDT);
  });
});
