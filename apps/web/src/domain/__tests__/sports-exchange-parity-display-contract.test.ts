import { describe, expect, it } from 'vitest';

import {
  assertSportsParityContractSync,
  findSportsActionPath,
  findSportsComplaintRisk,
  findSportsParityRow,
  findSportsZoneOwner,
  isSportsBoardSelectableMarketType,
  listSportsComplaintRisksByOwnerTodo,
  listSportsParityRowsByTier,
  P10_SPORTS_PARITY_CONTRACT_AND_BOARD_TODO,
  P10_SPORTS_PARITY_PREREQUISITE_TODOS,
  P10_SPORTS_SLIP_ADVANCED_TODO,
  SPORTS_ACTION_PATH_REGISTRY,
  SPORTS_BOARD_MARKETS_HOOK,
  SPORTS_BOARD_MARKETS_RPC,
  SPORTS_BOARD_PANEL_OWNER,
  SPORTS_BOARD_SELECTABLE_MARKET_TYPES,
  SPORTS_PARITY_MATRIX,
  SPORTS_UI_ZONE_OWNERS,
  SPORTS_USER_COMPLAINT_RISKS,
} from '../sports-exchange-parity-display-contract';

describe('sports-exchange-parity-display-contract §22.2.5', () => {
  it('locks Sports#1 owner todo and hub prerequisite', () => {
    expect(P10_SPORTS_PARITY_CONTRACT_AND_BOARD_TODO).toBe('p10-sports-parity-contract-and-board');
    expect(P10_SPORTS_PARITY_PREREQUISITE_TODOS).toContain('p10-sports-hub-pages');
  });

  it('registers parity matrix with Tier-A gaps mapped to P10 / Tier-B to E22', () => {
    expect(SPORTS_PARITY_MATRIX.length).toBeGreaterThanOrEqual(15);
    expect(findSportsParityRow('bet-single')?.tier).toBe('DONE');
    expect(findSportsParityRow('bet-combo')?.tier).toBe('DONE');
    expect(findSportsParityRow('bet-sgp')?.ownerTodo).toBe(P10_SPORTS_SLIP_ADVANCED_TODO);
    expect(findSportsParityRow('cashout-partial')?.tier).toBe('DONE');
    expect(findSportsParityRow('cashout-partial')?.phonara).toBe('yes');
    expect(findSportsParityRow('correct-score')?.tier).toBe('DONE');
    expect(findSportsParityRow('correct-score')?.phonara).toBe('yes');
    expect(findSportsParityRow('odds-accept-policy')?.phonara).toBe('yes');
    expect(findSportsParityRow('market-type-registry')?.tier).toBe('DONE');
    expect(findSportsParityRow('fixture-multi-market-board')?.tier).toBe('DONE');
    expect(findSportsParityRow('fixture-multi-market-board')?.engineRpc).toBe(
      SPORTS_BOARD_MARKETS_RPC,
    );
  });

  it('marks every matrix row as majors-true (pattern reference)', () => {
    for (const row of SPORTS_PARITY_MATRIX) {
      expect(row.majors).toBe(true);
    }
  });

  it('exposes selectable board market types for multi-market wire', () => {
    expect(SPORTS_BOARD_SELECTABLE_MARKET_TYPES).toEqual(
      expect.arrayContaining([
        'match_1x2',
        'totals',
        'spread',
        'handicap',
        'asian_handicap',
        'btts',
        'prop_over_under',
        'prop_yes_no',
        'correct_score',
      ]),
    );
    expect(isSportsBoardSelectableMarketType('totals')).toBe(true);
    expect(isSportsBoardSelectableMarketType('correct_score')).toBe(true);
    expect(SPORTS_BOARD_MARKETS_HOOK).toBe('useGetFixtureMarkets');
    expect(SPORTS_BOARD_PANEL_OWNER).toBe('sports-fixture-markets-panel.tsx');
  });

  it('defines single owner per sports UI zone', () => {
    expect(SPORTS_UI_ZONE_OWNERS.length).toBeGreaterThanOrEqual(4);
    expect(findSportsZoneOwner('bet-slip')?.forbiddenDuplicates).toContain('2nd slip mount');
    expect(findSportsZoneOwner('fixture-market-board')?.ownerComponent).toBe(
      'SportsFixtureMarketsPanel',
    );
    expect(findSportsZoneOwner('fixture-market-board')?.forbiddenDuplicates).toContain(
      'market-board-v2.tsx',
    );
    expect(findSportsZoneOwner('cashout-action')?.ownerTodo).toBe(P10_SPORTS_SLIP_ADVANCED_TODO);
  });

  it('registers action paths with shared hook modules', () => {
    expect(SPORTS_ACTION_PATH_REGISTRY.length).toBeGreaterThanOrEqual(5);
    expect(findSportsActionPath('toggle-slip-selection')?.sharedHookModule).toContain(
      'use-sports-bet-slip-state',
    );
    expect(findSportsActionPath('place-sports-bet')?.sharedHookModule).toContain(
      'use-sports-betting',
    );
    expect(findSportsActionPath('refresh-fixture-markets')?.canonicalSurface).toContain(
      'SportsFixtureMarketsPanel',
    );
  });

  it('registers required ComplaintRisk rows with sports-market-1x2-only live', () => {
    expect(SPORTS_USER_COMPLAINT_RISKS.map((row) => row.id)).toEqual(
      expect.arrayContaining([
        'sports-sgp-hidden-forever',
        'sports-cashout-dead',
        'sports-market-1x2-only',
        'sports-odds-changed-deadend',
        'sports-stake-cap-surprise',
      ]),
    );
    expect(findSportsComplaintRisk('sports-market-1x2-only')?.mitigatedBy).toBe('live');
    expect(findSportsComplaintRisk('sports-market-1x2-only')?.ownerTodo).toBe(
      P10_SPORTS_PARITY_CONTRACT_AND_BOARD_TODO,
    );
    expect(findSportsComplaintRisk('sports-sgp-hidden-forever')?.mitigatedBy).toBe('built_hidden');
    expect(
      listSportsComplaintRisksByOwnerTodo(P10_SPORTS_SLIP_ADVANCED_TODO).length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('lists pending Tier-A rows for later Sports# todos', () => {
    const tierA = listSportsParityRowsByTier('A');
    expect(tierA.some((row) => row.id === 'bet-sgp')).toBe(true);
    expect(tierA.some((row) => row.id === 'live-inplay-state')).toBe(false);
    expect(findSportsParityRow('live-inplay-state')?.tier).toBe('DONE');
    expect(findSportsParityRow('live-realtime-cache')?.tier).toBe('DONE');
    expect(tierA.every((row) => row.ownerTodo)).toBe(true);
  });

  it('assertSportsParityContractSync passes', () => {
    expect(() => assertSportsParityContractSync()).not.toThrow();
  });
});
