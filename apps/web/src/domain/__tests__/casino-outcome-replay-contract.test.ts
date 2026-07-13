import { describe, expect, it } from 'vitest';
import { GAME_CODES } from '@phonara/game-engine';

import { casinoGamePath } from '@/features/casino/game-config';
import { findTradeDualCurrencyRow } from '../trade-exchange-parity-display-contract';
import {
  assertCasinoOutcomeReplayContractSync,
  CASINO_OUTCOME_REPLAY_CONTRACT,
  CASINO_STAKE_CURRENCY_EXPOSURE,
  CASINO_STAKE_CURRENCY_MATRIX_ID,
  CASINO_WIN_TIER_LABEL_KEYS,
  casinoGameCodeFromSlug,
  casinoGamePlayPath,
  casinoGameSlugFromCode,
  deriveCasinoWinTier,
  findCasinoOutcomeReplayRow,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO,
  P10_CASINO_REPLAY_AND_INFRA_TODO,
  P10_CASINO_REPLAY_PREREQUISITE_TODOS,
  shouldShowCasinoWinTierOverlay,
} from '../casino-outcome-replay-contract';

describe('casino-outcome-replay-contract (p10-casino-replay-and-infra)', () => {
  it('locks owner todo, lobby prerequisite, and 12 one-shot rows', () => {
    assertCasinoOutcomeReplayContractSync();
    expect(P10_CASINO_REPLAY_AND_INFRA_TODO).toBe('p10-casino-replay-and-infra');
    expect(P10_CASINO_REPLAY_PREREQUISITE_TODOS).toContain('p10-page-casino');
    expect(P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO).toBe('p10-casino-fiat-hint-session-lock');
    expect(CASINO_OUTCOME_REPLAY_CONTRACT).toHaveLength(12);
    expect(CASINO_STAKE_CURRENCY_EXPOSURE).toBe('live');
  });

  it('covers every engine game with one_shot semantics and forbidden mid-round UX', () => {
    expect(GAME_CODES).toHaveLength(12);
    for (const code of GAME_CODES) {
      const row = findCasinoOutcomeReplayRow(code);
      expect(row.engineSemantics).toBe('one_shot');
      expect(row.inputPhase.length).toBeGreaterThan(0);
      expect(row.replayPhase.length).toBeGreaterThan(0);
      expect(row.forbiddenUx.length).toBeGreaterThan(0);
      expect(casinoGamePlayPath(code)).toBe(casinoGamePath(code));
      expect(casinoGameCodeFromSlug(casinoGameSlugFromCode(code))).toBe(code);
    }
    expect(findCasinoOutcomeReplayRow('crash').forbiddenUx).toMatch(/cash-out/i);
    expect(findCasinoOutcomeReplayRow('mines').forbiddenUx).toMatch(/cash-out/i);
  });

  it('derives WinTier from RPC payout÷stake with Decimal thresholds only', () => {
    expect(deriveCasinoWinTier({ status: 'lost', payout: '0', stake: '10' })).toBe('none');
    expect(deriveCasinoWinTier({ status: 'won', payout: '10', stake: '10' })).toBe('none');
    expect(deriveCasinoWinTier({ status: 'won', payout: '20', stake: '10' })).toBe('small');
    expect(deriveCasinoWinTier({ status: 'won', payout: '50', stake: '10' })).toBe('medium');
    expect(deriveCasinoWinTier({ status: 'won', payout: '200', stake: '10' })).toBe('big');
    expect(deriveCasinoWinTier({ status: 'won', payout: '1000', stake: '10' })).toBe('mega');
    expect(shouldShowCasinoWinTierOverlay('small')).toBe(false);
    expect(shouldShowCasinoWinTierOverlay('big')).toBe(true);
    expect(shouldShowCasinoWinTierOverlay('mega')).toBe(true);
    expect(CASINO_WIN_TIER_LABEL_KEYS.big).toBe('casino.win.tier.big');
  });

  it('marks casino-stake-currency dual matrix live for USDT/PHON shell toggle', () => {
    const row = findTradeDualCurrencyRow(CASINO_STAKE_CURRENCY_MATRIX_ID);
    expect(row?.usdt).toBe(true);
    expect(row?.phon).toBe(true);
    expect(row?.phonara).toBe('yes');
    expect(row?.ownerTodo).toBeNull();
  });
});
