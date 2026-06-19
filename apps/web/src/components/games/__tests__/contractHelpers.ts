import { vi } from 'vitest';
import { GAME_BY_CODE } from '../../../features/casino/game-config';
import type {
  GameCode,
  ImportedGameSurfaceProps,
  SelectionFor,
} from '../shared/types';

/** Shared fixture factory for game contract / outcome-leak / shortkey tests. */
export function makeSurfaceProps<G extends GameCode>(
  gameCode: G,
  overrides: Partial<ImportedGameSurfaceProps<G>> = {},
): ImportedGameSurfaceProps<G> {
  const config = GAME_BY_CODE[gameCode];

  return {
    gameCode,
    currency: 'PHON',
    stake: config.defaultStake,
    selection: config.defaultSelection as SelectionFor<G>,
    clientSeed: 'deadbeef',
    availableBalance: '10000',
    commitment: null,
    bet: null,
    verification: null,
    recentBets: [],
    busy: false,
    confirmOpen: false,
    onStakeChange: vi.fn(),
    onCurrencyChange: vi.fn(),
    onSelectionChange: vi.fn(),
    onClientSeedChange: vi.fn(),
    onPrepareRound: vi.fn(),
    onOpenBetConfirm: vi.fn(),
    onSubmitBet: vi.fn(),
    onCancelBetConfirm: vi.fn(),
    ...overrides,
  };
}
