/**
 * Sports betting E2E — prematch slip place · settle · Σ=0.
 * Operator/CI authoritative (G13 — agent must not run autonomously).
 *
 * Target: `bun run test:e2e:casino -- tests/e2e/sports-betting.spec.ts`
 * (web-only config; admin port not required)
 */
import { test, expect } from '@playwright/test';

import {
  authedSportsClient,
  currencyTotals,
  enableSportsFeatureFlag,
  prepareSportsSession,
  provisionSportsE2EFixture,
  seedPrematchFixture,
  serviceClient,
  settleFixtureWin,
  type SportsE2EFixture,
} from './fixtures/sports-fixture';

test.describe('sports betting money gate', () => {
  let fixture: SportsE2EFixture;

  test.beforeAll(async () => {
    fixture = await provisionSportsE2EFixture();
  });

  test.beforeEach(async ({ page }) => {
    enableSportsFeatureFlag();
    await prepareSportsSession(page, fixture);
  });

  test('sports page mounts prematch board', async ({ page }) => {
    await page.goto('/sports/prematch', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('sports-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('sports-page-loading')).toHaveCount(0, { timeout: 60_000 });
  });

  test('place single prematch via RPC preserves Σ=0 after settle', async ({ page }) => {
    test.setTimeout(180_000);
    const admin = serviceClient();
    const client = authedSportsClient(fixture);
    const seeded = await seedPrematchFixture(admin, `rpc-${Date.now()}`);
    const before = currencyTotals(admin);

    await page.goto('/sports/prematch', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('sports-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId(`sports-fixture-row-${seeded.fixtureId}`)).toBeVisible({
      timeout: 60_000,
    });

    const placed = await client.rpc('rpc_place_sports_bet', {
      p_legs: [{ outcome_id: seeded.outcomeHomeId, odds_at_bet: seeded.homeOdds }],
      p_stake: '100.000000',
      p_currency: 'PHON',
      p_idempotency_key: `sports-e2e-place-${Date.now()}`,
    });
    expect(placed.error, `place sports bet: ${placed.error?.message ?? ''}`).toBeNull();
    expect(placed.data?.bet_id, 'bet id present').toBeTruthy();

    const afterPlace = currencyTotals(admin);
    expect(afterPlace.PHON, 'place must conserve PHON Σ').toBe(before.PHON);
    expect(afterPlace.USDT, 'place must conserve USDT Σ').toBe(before.USDT);

    await settleFixtureWin(admin, seeded.fixtureId, 1, 0);
    const afterSettle = currencyTotals(admin);
    expect(afterSettle.PHON, 'settle must conserve PHON Σ').toBe(before.PHON);
    expect(afterSettle.USDT, 'settle must conserve USDT Σ').toBe(before.USDT);
  });

  test('RPC idempotency replay returns same bet without extra lock', async () => {
    test.setTimeout(120_000);
    const admin = serviceClient();
    enableSportsFeatureFlag();
    const client = authedSportsClient(fixture);
    const seeded = await seedPrematchFixture(admin, `idem-${Date.now()}`);
    const idem = `sports-e2e-idem-${Date.now()}`;

    const first = await client.rpc('rpc_place_sports_bet', {
      p_legs: [{ outcome_id: seeded.outcomeHomeId, odds_at_bet: seeded.homeOdds }],
      p_stake: '50.000000',
      p_currency: 'PHON',
      p_idempotency_key: idem,
    });
    expect(first.error, `first place: ${first.error?.message ?? ''}`).toBeNull();

    const second = await client.rpc('rpc_place_sports_bet', {
      p_legs: [{ outcome_id: seeded.outcomeHomeId, odds_at_bet: seeded.homeOdds }],
      p_stake: '50.000000',
      p_currency: 'PHON',
      p_idempotency_key: idem,
    });
    expect(second.error, `replay place: ${second.error?.message ?? ''}`).toBeNull();
    expect(second.data?.bet_id).toBe(first.data?.bet_id);
    expect(second.data?.already_placed).toBe(true);

    const { count } = await admin
      .from('sports_bets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', fixture.userId)
      .eq('idempotency_key', idem);
    expect(count).toBe(1);
  });
});
