import { describe, expect, it } from 'vitest';
import { GAME_CODES } from '@phonara/game-engine';

import {
  assertCasinoFairnessDisplayContractSync,
  CASINO_FAIRNESS_CLIENT_SEED_MODE,
  CASINO_FAIRNESS_EXPOSURE,
  CASINO_FAIRNESS_FORBIDDEN_UI,
  CASINO_FAIRNESS_GAME_CODES,
  CASINO_FAIRNESS_NONCE,
  CASINO_FAIRNESS_ROUTE,
  CASINO_FAIRNESS_SEED_ROTATION_UI_EXPOSED,
  CASINO_FAIRNESS_VERIFY_SOURCE,
  isCasinoFairnessGameCode,
  P10_PAGE_CASINO_FAIRNESS_PREREQUISITE_TODOS,
  P10_PAGE_CASINO_FAIRNESS_TODO,
  resolveCasinoFairnessPfCtaEnabled,
} from '../casino-fairness-display-contract';

describe('casino-fairness-display-contract (p10-page-casino-fairness)', () => {
  it('locks owner todo, Batch D prerequisite, and live fairness exposure', () => {
    assertCasinoFairnessDisplayContractSync();
    expect(P10_PAGE_CASINO_FAIRNESS_TODO).toBe('p10-page-casino-fairness');
    expect(P10_PAGE_CASINO_FAIRNESS_PREREQUISITE_TODOS).toContain('p10-games-batch-d');
    expect(CASINO_FAIRNESS_ROUTE).toBe('/casino/fairness');
    expect(CASINO_FAIRNESS_EXPOSURE).toBe('live');
    expect(CASINO_FAIRNESS_VERIFY_SOURCE).toContain('verifyRound');
    expect(resolveCasinoFairnessPfCtaEnabled()).toBe(true);
  });

  it('locks §23.2.1 PF limits — one-shot nonce=1 · E23 account PF when live', () => {
    expect(CASINO_FAIRNESS_NONCE).toBe(1);
    if (CASINO_FAIRNESS_SEED_ROTATION_UI_EXPOSED) {
      expect(CASINO_FAIRNESS_CLIENT_SEED_MODE).toBe('account_or_per_bet');
      expect(CASINO_FAIRNESS_FORBIDDEN_UI).toHaveLength(0);
    } else {
      expect(CASINO_FAIRNESS_CLIENT_SEED_MODE).toBe('per_bet');
      expect(CASINO_FAIRNESS_FORBIDDEN_UI).toContain('seed_rotation_controls');
      expect(CASINO_FAIRNESS_FORBIDDEN_UI).toContain('nonce_increment_controls');
    }
  });

  it('covers all 12 engine game codes for the verifier', () => {
    expect(CASINO_FAIRNESS_GAME_CODES).toEqual(GAME_CODES);
    expect(CASINO_FAIRNESS_GAME_CODES).toHaveLength(12);
    expect(isCasinoFairnessGameCode('dice')).toBe(true);
    expect(isCasinoFairnessGameCode('mint_reels')).toBe(true);
    expect(isCasinoFairnessGameCode('not-a-game')).toBe(false);
  });
});
