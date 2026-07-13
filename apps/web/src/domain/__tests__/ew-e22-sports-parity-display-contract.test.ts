import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertEwE22SportsParityWaveSync,
  EW_E22_DEFERRED_FEATURES,
  EW_E22_EXISTS_CASHOUT_BET_RPC,
  EW_E22_EXISTS_FEATURES,
  EW_E22_EXISTS_PREVIEW_CASHOUT_RPC,
  EW_E22_EXISTS_RPC_REMIGRATION_FORBIDDEN,
  EW_E22_FULL_CASHOUT_UI_SAME_PR_REQUIRED,
  EW_E22_FULL_CASHOUT_UI_TODO,
  EW_E22_LIST_SPORTS_CATALOG_RPC,
  EW_E22_NEW_ENGINE_FEATURES,
  EW_E22_ODDS_ACCEPTANCE_POLICIES,
  EW_E22_PARTIAL_CASHOUT_RPC,
  EW_E22_PARTIAL_PREVIEW_RPC,
  EW_E22_SPORTS_PARITY_ADR_PATH,
  EW_E22_SPORTS_PARITY_ARTIFACT_PATHS,
  EW_E22_SPORTS_PARITY_MIGRATION_IN_THIS_TODO,
  EW_E22_SPORTS_PARITY_MIGRATION_NAME,
  EW_E22_SPORTS_PARITY_NEXT_TODO,
  EW_E22_SPORTS_PARITY_PREREQUISITE_TODO,
  EW_E22_SPORTS_PARITY_TODO,
  isEwE22FullCashoutUiWired,
  isEwE22SportsParityEngineReady,
  isEwE22SportsParityLiveUnlocked,
} from '../ew-e22-sports-parity-display-contract';

const repoRoot = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('ew-e22-sports-parity-display-contract (E22 WAVE)', () => {
  it('pins WAVE todo ids · NEW vs EXISTS · engine ready', () => {
    assertEwE22SportsParityWaveSync();
    expect(EW_E22_SPORTS_PARITY_TODO).toBe('ew-e22-sports-parity-wave');
    expect(EW_E22_SPORTS_PARITY_PREREQUISITE_TODO).toBe('ew-e21-ui-trade-engine-unlocks');
    expect(EW_E22_SPORTS_PARITY_NEXT_TODO).toBe('ew-e22-gate-sports-parity');
    expect(EW_E22_FULL_CASHOUT_UI_TODO).toBe('p10-sports-slip-advanced-wire');
    expect(EW_E22_SPORTS_PARITY_MIGRATION_IN_THIS_TODO).toBe(true);
    expect(EW_E22_EXISTS_RPC_REMIGRATION_FORBIDDEN).toBe(true);
    expect(EW_E22_FULL_CASHOUT_UI_SAME_PR_REQUIRED).toBe(true);
    expect([...EW_E22_NEW_ENGINE_FEATURES]).toEqual([
      'partial_cashout',
      'odds_acceptance',
      'correct_score',
      'sport_catalog',
    ]);
    expect([...EW_E22_EXISTS_FEATURES]).toEqual(['full_cashout']);
    expect([...EW_E22_DEFERRED_FEATURES]).toEqual(['bet_builder_correlated', 'vendor_feed_worker']);
    expect([...EW_E22_ODDS_ACCEPTANCE_POLICIES]).toEqual(['strict', 'accept_any', 'accept_better']);
    expect(isEwE22SportsParityEngineReady()).toBe(true);
    expect(isEwE22FullCashoutUiWired()).toBe(true);
    expect(typeof isEwE22SportsParityLiveUnlocked()).toBe('boolean');
  });

  it('requires ADR + migration + SQL test · forbids full cashout remigration', () => {
    for (const rel of EW_E22_SPORTS_PARITY_ARTIFACT_PATHS) {
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    const adr = readRepo(EW_E22_SPORTS_PARITY_ADR_PATH);
    expect(adr).toContain('Accepted');
    expect(adr).toContain(EW_E22_SPORTS_PARITY_TODO);
    expect(adr).toContain(EW_E22_PARTIAL_CASHOUT_RPC);
    expect(adr).toContain('accept_better');
    expect(adr).toContain('correct_score');
    expect(adr).toContain(EW_E22_EXISTS_CASHOUT_BET_RPC);
    expect(adr).toContain('migration **0**');
    expect(adr).toContain('Bet builder');

    const migration = readRepo('supabase/migrations/20260809000001_ew_e22_sports_parity.sql');
    expect(migration).toContain(EW_E22_SPORTS_PARITY_MIGRATION_NAME);
    expect(migration).toContain(EW_E22_PARTIAL_CASHOUT_RPC);
    expect(migration).toContain(EW_E22_PARTIAL_PREVIEW_RPC);
    expect(migration).toContain(EW_E22_LIST_SPORTS_CATALOG_RPC);
    expect(migration).toContain('sports_odds_acceptance');
    expect(migration).toContain('p_odds_acceptance');
    expect(migration).toContain('correct_score');
    expect(migration).toContain('sports_sport_catalog');
    expect(migration).not.toContain('CREATE OR REPLACE FUNCTION rpc_cashout_sports_bet');
    expect(migration).not.toContain('CREATE OR REPLACE FUNCTION _sports_cashout_offer');
    expect(migration).toContain('_sports_cashout_offer');
    expect(EW_E22_EXISTS_PREVIEW_CASHOUT_RPC).toBe('rpc_preview_sports_cashout');

    const sqlTest = readRepo('supabase/tests/ew_e22_sports_parity_test.sql');
    expect(sqlTest).toContain('E22-0');
    expect(sqlTest).toContain('E22-2');
    expect(sqlTest).toContain(EW_E22_PARTIAL_CASHOUT_RPC);
  });
});
