import { describe, expect, it } from 'vitest';

import {
  assertCasinoGamesBatchDContractSync,
  CASINO_BATCH_D_GAME_CODES,
  CASINO_BATCH_D_L1_SPECS,
  CASINO_BLACKJACK_ACTIONS_HELP_KEY,
  CASINO_DEEPSHAFT_DEPTH_HELP_KEY,
  CASINO_ROULETTE_BET_MAP_HELP_KEY,
  blackjackDealStepMs,
  decodeBlackjackCard,
  deepshaftLevelStepMs,
  isCasinoBatchDGame,
  normalizeBlackjackActions,
  normalizeDeepshaftRiskTier,
  normalizeDeepshaftTargetDepth,
  normalizeRouletteLegs,
  P10_GAMES_BATCH_D_PREREQUISITE_TODOS,
  P10_GAMES_BATCH_D_TODO,
  parseBlackjackLiveHands,
  parseBlackjackOutcome,
  parseDeepshaftOutcome,
  parseRouletteOutcome,
  rouletteChipDropMs,
  roulettePocketColor,
  rouletteSpinEase,
  rouletteSpinMs,
  rouletteWheelAngleForNumber,
  upsertRouletteLeg,
} from '../casino-games-batch-d-display-contract';

describe('casino-games-batch-d-display-contract (p10-games-batch-d)', () => {
  it('locks owner todo, prerequisites, and table L1 specs', () => {
    assertCasinoGamesBatchDContractSync();
    expect(P10_GAMES_BATCH_D_TODO).toBe('p10-games-batch-d');
    expect(P10_GAMES_BATCH_D_PREREQUISITE_TODOS).toContain('p10-casino-replay-and-infra');
    expect(P10_GAMES_BATCH_D_PREREQUISITE_TODOS).toContain('p10-games-batch-c');
    expect(CASINO_BATCH_D_GAME_CODES).toEqual(['roulette', 'blackjack', 'deepshaft']);
    expect(isCasinoBatchDGame('roulette')).toBe(true);
    expect(isCasinoBatchDGame('plinko')).toBe(false);
    expect(CASINO_BATCH_D_L1_SPECS.roulette.render).toBe('react_svg_dom_table');
    expect(CASINO_BATCH_D_L1_SPECS.roulette.l1).toMatch(/wheel spin/i);
    expect(CASINO_BATCH_D_L1_SPECS.blackjack.forbidden).toMatch(/live hit\/stand/i);
    expect(CASINO_BATCH_D_L1_SPECS.deepshaft.l1).toBe('depth meter');
    expect(CASINO_BLACKJACK_ACTIONS_HELP_KEY).toBe('casino.help.blackjackActionsBeforeBet');
    expect(CASINO_DEEPSHAFT_DEPTH_HELP_KEY).toBe('casino.help.deepshaftDepthBeforeBet');
    expect(CASINO_ROULETTE_BET_MAP_HELP_KEY).toBe('casino.help.rouletteBetMapBeforeBet');
  });

  it('parses RPC outcomes without inventing settlement fields', () => {
    expect(parseRouletteOutcome({ winningNumber: 0, totalMultiplier: 36 })).toEqual({
      winningNumber: 0,
      totalMultiplier: 36,
    });
    expect(parseRouletteOutcome({ winningNumber: 37, totalMultiplier: 1 })).toBeNull();
    expect(parseBlackjackOutcome({ totalMultiplier: 2.5 })).toEqual({
      totalMultiplier: 2.5,
      playerCards: [],
      dealerCards: [],
      playerValue: null,
      dealerValue: null,
    });
    expect(parseBlackjackOutcome({ totalMultiplier: -1 })).toBeNull();
    expect(
      parseBlackjackOutcome({
        totalMultiplier: 2,
        player: [1, 13],
        dealer: [26, 39, 2],
        playerValue: 21,
        dealerValue: 18,
      }),
    ).toEqual({
      totalMultiplier: 2,
      playerCards: [1, 13],
      dealerCards: [26, 39, 2],
      playerValue: 21,
      dealerValue: 18,
    });
    expect(
      parseBlackjackOutcome({
        player: [5, 6],
        dealer: [10, 11],
        outcome: 'won',
        playerValue: 11,
        dealerValue: 20,
      }),
    ).toMatchObject({ totalMultiplier: 2, playerCards: [5, 6] });
    expect(parseBlackjackLiveHands({ player: [1, 2], dealer: [3], dealerUp: 10 })).toEqual({
      playerCards: [1, 2],
      dealerCards: [3],
      playerValue: null,
      dealerUp: 10,
    });
    expect(decodeBlackjackCard(1)).toMatchObject({
      rankLabel: 'A',
      suit: 'spades',
      color: 'black',
      suitSymbol: '♠',
    });
    expect(decodeBlackjackCard(14)).toMatchObject({ rankLabel: 'A', suit: 'hearts', color: 'red' });
    expect(decodeBlackjackCard(0)).toBeNull();
    expect(blackjackDealStepMs()).toBe(280);
    expect(
      parseDeepshaftOutcome({
        levels: [
          { depth: 1, outcome: 'gold', levelMultiplier: 1.05 },
          { depth: 2, outcome: 'cavein', levelMultiplier: 0 },
        ],
        reachedDepth: 1,
        caveIn: true,
        totalMultiplier: 0,
        won: false,
      }),
    ).toMatchObject({ caveIn: true, reachedDepth: 1, won: false });
    expect(
      parseDeepshaftOutcome({
        levels: [],
        reachedDepth: 0,
        caveIn: false,
        totalMultiplier: 1,
        won: true,
      }),
    ).toMatchObject({ levels: [], won: true });
  });

  it('normalizes selection helpers for table games', () => {
    expect(normalizeRouletteLegs([{ type: 'red', value: null, stakeWeight: 5 }])).toEqual([
      { type: 'red', value: null, stakeWeight: 5 },
    ]);
    expect(normalizeRouletteLegs([{ type: 'straight', value: null, stakeWeight: 1 }])).toEqual([]);
    expect(
      normalizeBlackjackActions([
        { seat: 0, move: 'hit' },
        { seat: 0, move: 'stand' },
      ]),
    ).toEqual([
      { seat: 0, move: 'hit' },
      { seat: 0, move: 'stand' },
    ]);
    expect(normalizeBlackjackActions([{ seat: 0, move: 'fold' }])).toEqual([]);
    expect(normalizeDeepshaftRiskTier('deep')).toBe('deep');
    expect(normalizeDeepshaftRiskTier('x')).toBe('standard');
    expect(normalizeDeepshaftTargetDepth(12)).toBe(12);
    expect(normalizeDeepshaftTargetDepth(99)).toBe(5);
    expect(roulettePocketColor(0)).toBe('green');
    expect(roulettePocketColor(1)).toBe('red');
    expect(roulettePocketColor(2)).toBe('black');
    expect(
      upsertRouletteLeg([{ type: 'red', value: null, stakeWeight: 1 }], {
        type: 'red',
        value: null,
        stakeWeight: 5,
      }),
    ).toEqual([{ type: 'red', value: null, stakeWeight: 6 }]);
    expect(deepshaftLevelStepMs(5)).toBeGreaterThanOrEqual(50);
  });

  it('locks roulette spin band, decelerating ease, chip-drop band, and wheel angles', () => {
    const spinMs = rouletteSpinMs();
    expect(spinMs).toBeGreaterThanOrEqual(800);
    expect(spinMs).toBeLessThanOrEqual(1200);
    const early = rouletteSpinEase(0.4) - rouletteSpinEase(0.1);
    const late = rouletteSpinEase(0.9) - rouletteSpinEase(0.6);
    expect(early).toBeGreaterThan(late);
    const chipMs = rouletteChipDropMs();
    expect(chipMs).toBeGreaterThanOrEqual(120);
    expect(chipMs).toBeLessThanOrEqual(200);
    expect(rouletteWheelAngleForNumber(0)).toBe(0);
    expect(rouletteWheelAngleForNumber(32)).toBeGreaterThan(0);
  });
});
