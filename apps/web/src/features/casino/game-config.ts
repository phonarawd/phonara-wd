import type { GameCode } from '@phonara/game-engine';
import type { GameConfig } from './types';

/** URL path for a casino game route (engine code → hyphenated path). */
export function casinoGamePath(code: GameCode): string {
  if (code === 'dice') return '/casino/dice';
  return `/casino/${code.replace(/_/g, '-')}`;
}

export const GAME_CONFIGS: GameConfig[] = [
  {
    code: 'crash',
    labelKey: 'casino.game.crash',
    descriptionKey: 'casino.game.crash.desc',
    defaultStake: '10',
    defaultSelection: { autoCashout: '2.00' },
    fields: [{ kind: 'text', key: 'autoCashout', labelKey: 'casino.field.autoCashout', inputMode: 'decimal' }],
  },
  {
    code: 'limbo',
    labelKey: 'casino.game.limbo',
    descriptionKey: 'casino.game.limbo.desc',
    defaultStake: '10',
    defaultSelection: { target: '2.00' },
    fields: [{ kind: 'text', key: 'target', labelKey: 'casino.field.targetMultiplier', inputMode: 'decimal' }],
  },
  {
    code: 'dice',
    labelKey: 'casino.game.dice',
    descriptionKey: 'casino.game.dice.desc',
    defaultStake: '10',
    defaultSelection: { target: '50.00', direction: 'over' },
    fields: [
      { kind: 'text', key: 'target', labelKey: 'casino.field.target', inputMode: 'decimal' },
      {
        kind: 'select',
        key: 'direction',
        labelKey: 'casino.field.direction',
        options: [
          { value: 'over', labelKey: 'casino.option.over' },
          { value: 'under', labelKey: 'casino.option.under' },
        ],
      },
    ],
  },
  {
    code: 'mines',
    labelKey: 'casino.game.mines',
    descriptionKey: 'casino.game.mines.desc',
    defaultStake: '10',
    defaultSelection: { mineCount: 3, revealedCells: [0, 1, 2] },
    fields: [
      { kind: 'number', key: 'mineCount', labelKey: 'casino.field.mineCount', min: 1, max: 24 },
      { kind: 'cells', key: 'revealedCells', labelKey: 'casino.field.revealedCells', max: 24 },
    ],
  },
  {
    code: 'hilo',
    labelKey: 'casino.game.hilo',
    descriptionKey: 'casino.game.hilo.desc',
    defaultStake: '10',
    defaultSelection: { startCard: null, guesses: ['higher'] },
    fields: [
      {
        kind: 'select',
        key: 'guesses.0',
        labelKey: 'casino.field.firstGuess',
        options: [
          { value: 'higher', labelKey: 'casino.option.higher' },
          { value: 'lower', labelKey: 'casino.option.lower' },
          { value: 'skip', labelKey: 'casino.option.skip' },
        ],
      },
    ],
  },
  {
    code: 'plinko',
    labelKey: 'casino.game.plinko',
    descriptionKey: 'casino.game.plinko.desc',
    defaultStake: '10',
    defaultSelection: { rows: 12, risk: 'medium' },
    fields: [
      {
        kind: 'select',
        key: 'rows',
        labelKey: 'casino.field.rows',
        options: [
          { value: '8', labelKey: 'casino.option.rows8' },
          { value: '12', labelKey: 'casino.option.rows12' },
          { value: '16', labelKey: 'casino.option.rows16' },
        ],
      },
      {
        kind: 'select',
        key: 'risk',
        labelKey: 'casino.field.risk',
        options: [
          { value: 'low', labelKey: 'casino.option.low' },
          { value: 'medium', labelKey: 'casino.option.medium' },
          { value: 'high', labelKey: 'casino.option.high' },
        ],
      },
    ],
  },
  {
    code: 'mint_reels',
    labelKey: 'casino.game.mint_reels',
    descriptionKey: 'casino.game.mint_reels.desc',
    defaultStake: '10',
    defaultSelection: { lines: 20 },
    fields: [{ kind: 'number', key: 'lines', labelKey: 'casino.field.lines', min: 1, max: 20 }],
  },
  {
    code: 'gold_rush',
    labelKey: 'casino.game.gold_rush',
    descriptionKey: 'casino.game.gold_rush.desc',
    defaultStake: '10',
    defaultSelection: { lines: 20 },
    fields: [{ kind: 'number', key: 'lines', labelKey: 'casino.field.lines', min: 1, max: 20 }],
  },
  {
    code: 'roulette',
    labelKey: 'casino.game.roulette',
    descriptionKey: 'casino.game.roulette.desc',
    defaultStake: '10',
    defaultSelection: { bets: [{ type: 'red', value: null, stakeWeight: 1 }] },
    fields: [],
  },
  {
    code: 'blackjack',
    labelKey: 'casino.game.blackjack',
    descriptionKey: 'casino.game.blackjack.desc',
    defaultStake: '10',
    defaultSelection: { actions: [{ seat: 0, move: 'stand' }] },
    fields: [],
  },
];

export const GAME_BY_CODE = Object.fromEntries(
  GAME_CONFIGS.map((game) => [game.code, game]),
) as Record<GameCode, GameConfig>;
