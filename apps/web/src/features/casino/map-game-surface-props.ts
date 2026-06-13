import type { ImportedGameSurfaceProps } from '../../components/games/shared/types';
import type { BetResponse, Currency, RecentBet, RoundCommitment, VerificationEvidence } from './types';

export type MapGameSurfacePropsInput = {
  gameCode: ImportedGameSurfaceProps['gameCode'];
  currency: Currency;
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
  onCurrencyChange: (currency: Currency) => void;
  onSelectionChange: (selection: Record<string, unknown>) => void;
  onClientSeedChange: (seed: string) => void;
  onPrepareRound: () => void;
  onOpenBetConfirm: () => void;
  onSubmitBet: () => void;
  onCancelBetConfirm: () => void;
};

/** Maps engine state to Lovable `ImportedGameSurfaceProps` (contract frozen). */
export function mapGameSurfaceProps(input: MapGameSurfacePropsInput): ImportedGameSurfaceProps {
  return {
    gameCode: input.gameCode,
    currency: input.currency,
    stake: input.stake,
    selection: input.selection,
    clientSeed: input.clientSeed,
    availableBalance: input.availableBalance,
    commitment: input.commitment,
    bet: input.bet,
    verification: input.verification,
    recentBets: input.recentBets,
    busy: input.busy,
    confirmOpen: input.confirmOpen,
    onStakeChange: input.onStakeChange,
    onCurrencyChange: input.onCurrencyChange,
    onSelectionChange: input.onSelectionChange,
    onClientSeedChange: input.onClientSeedChange,
    onPrepareRound: input.onPrepareRound,
    onOpenBetConfirm: input.onOpenBetConfirm,
    onSubmitBet: input.onSubmitBet,
    onCancelBetConfirm: input.onCancelBetConfirm,
  };
}
