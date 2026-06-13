import type { GameCode } from '@phonara/game-engine';
import type {
  BetResponse,
  RecentBet,
  RoundCommitment,
  VerificationEvidence,
} from '../../../features/casino/types';

/**
 * Contract for Lovable game surfaces — see docs/GAMES-INTEGRATION.md
 */
export type ImportedGameSurfaceProps = {
  gameCode: GameCode;
  currency: 'PHON' | 'USDT';
  stake: string;
  selection: Record<string, unknown>;
  clientSeed: string;
  availableBalance: string | null;
  commitment: RoundCommitment | null;
  bet: BetResponse | null;
  verification: VerificationEvidence | null;
  recentBets: RecentBet[];
  busy: boolean;
  confirmOpen: boolean;
  onStakeChange: (value: string) => void;
  onCurrencyChange: (currency: 'PHON' | 'USDT') => void;
  onSelectionChange: (selection: Record<string, unknown>) => void;
  onClientSeedChange: (seed: string) => void;
  onPrepareRound: () => void;
  onOpenBetConfirm: () => void;
  onSubmitBet: () => void;
  onCancelBetConfirm: () => void;
};
