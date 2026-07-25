/**
 * Casino dice E2E — shell mount · bet → settle → PF verify · Σ=0.
 * Operator/CI authoritative (G13 — agent must not run autonomously).
 *
 * Target: `bun run test:e2e:casino -- tests/e2e/casino-dice.spec.ts`
 */
import { test, expect } from '@playwright/test';

import { verifyRound } from '../../packages/game-engine/src/fairness/verifier.ts';
import {
  authedCasinoClient,
  currencyTotals,
  gotoCasinoDice,
  gotoCasinoFairness,
  prepareCasinoSession,
  provisionCasinoE2EFixture,
  rpcCasino,
  serviceClient,
  type CasinoE2EFixture,
} from './fixtures/casino-money';

interface RoundCommitment {
  round_id: string;
  server_seed_hash: string;
}

interface BetResponse {
  bet_id: string;
  status: string;
  server_seed_hash: string;
  result: Record<string, unknown>;
  already_placed: boolean;
}

interface RevealResponse {
  server_seed: string;
  server_seed_hash: string;
  result: Record<string, unknown>;
}

const DICE_SELECTION = { target: '50.00', direction: 'over' as const };
const DICE_STAKE = '10.000000';

test.describe('casino dice PF money gate', () => {
  let fixture: CasinoE2EFixture;

  test.beforeAll(async () => {
    fixture = await provisionCasinoE2EFixture();
  });

  test.beforeEach(async ({ page }) => {
    await prepareCasinoSession(page, fixture);
  });

  test('dice shell mounts on /games/dice', async ({ page }) => {
    await gotoCasinoDice(page);
    await expect(page.getByTestId('casino-stake-input')).toBeVisible();
    await expect(page.getByTestId('casino-place-bet')).toBeVisible();
  });

  test('fairness verifier page mounts', async ({ page }) => {
    await gotoCasinoFairness(page);
    await expect(page.getByTestId('casino-fairness-verifier')).toBeVisible();
  });

  test('dice: open → place → reveal → verifyRound · Σ=0 · idempotent', async ({ page }) => {
    test.setTimeout(180_000);
    const admin = serviceClient();
    const client = authedCasinoClient(fixture);

    await gotoCasinoDice(page);
    // Unload Pixi/canvas before long RPC section (low-spec CPU guard).
    await page.goto('about:blank', { waitUntil: 'commit', timeout: 15_000 });

    const before = currencyTotals(admin);
    const round = await rpcCasino<RoundCommitment>(client, 'rpc_open_game_round', {
      p_game: 'dice',
    });
    expect(round.server_seed_hash, 'commit hash hash length').toHaveLength(64);
    expect(Object.hasOwn(round, 'server_seed'), 'server seed hidden at commit').toBe(false);

    const clientSeed = `casino-e2e-dice-${Date.now()}`;
    const idempotencyKey = `casino-e2e-dice-${crypto.randomUUID()}`;
    const bet = await rpcCasino<BetResponse>(client, 'rpc_place_game_bet', {
      p_round_id: round.round_id,
      p_currency: 'PHON',
      p_stake: DICE_STAKE,
      p_selection: DICE_SELECTION,
      p_client_seed: clientSeed,
      p_idempotency_key: idempotencyKey,
    });
    expect(['won', 'lost'].includes(bet.status), 'terminal bet status').toBe(true);
    expect(bet.server_seed_hash, 'bet hash matches commit').toBe(round.server_seed_hash);

    const duplicate = await rpcCasino<BetResponse>(client, 'rpc_place_game_bet', {
      p_round_id: round.round_id,
      p_currency: 'PHON',
      p_stake: DICE_STAKE,
      p_selection: DICE_SELECTION,
      p_client_seed: clientSeed,
      p_idempotency_key: idempotencyKey,
    });
    expect(duplicate.already_placed, 'duplicate is idempotent').toBe(true);
    expect(duplicate.bet_id, 'duplicate bet id').toBe(bet.bet_id);

    const reveal = await rpcCasino<RevealResponse>(client, 'rpc_reveal_game_round', {
      p_round_id: round.round_id,
    });
    expect(reveal.server_seed_hash, 'reveal hash').toBe(round.server_seed_hash);
    expect(reveal.result, 'reveal result matches bet').toEqual(bet.result);

    const verified = await verifyRound({
      game: 'dice',
      serverSeed: reveal.server_seed,
      serverSeedHash: round.server_seed_hash,
      clientSeed,
      nonce: 1,
      selection: DICE_SELECTION,
      expectedResult: reveal.result,
    });
    expect(verified.seedHashMatch, 'seed hash verified').toBe(true);
    expect(verified.resultMatch, 'result recomputed').toBe(true);

    const tampered = await verifyRound({
      game: 'dice',
      serverSeed: `${reveal.server_seed}:tampered`,
      serverSeedHash: round.server_seed_hash,
      clientSeed,
      nonce: 1,
      selection: DICE_SELECTION,
      expectedResult: reveal.result,
    });
    expect(tampered.seedHashMatch, 'tampered seed rejected').toBe(false);

    const after = currencyTotals(admin);
    expect(after.PHON, 'PHON conserved').toBe(before.PHON);
    expect(after.USDT, 'USDT conserved').toBe(before.USDT);

    const { count: betCount } = await admin
      .from('game_bets')
      .select('*', { count: 'exact', head: true })
      .eq('id', bet.bet_id)
      .eq('user_id', fixture.userId);
    expect(betCount, 'one user bet row').toBe(1);
  });
});
