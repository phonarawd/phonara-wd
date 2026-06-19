import type { GameCode } from '@phonara/game-engine';
import type { ImportedGameSurfaceProps } from '../../components/games/shared/types';
import { normalizeRecentBets } from '../../components/games/shared/adapt-recent-bet';
import type { FairnessUiEvidence } from '../../components/games/shared/types';
import type { BetResponse, Currency, RecentBet, RoundCommitment, VerificationEvidence } from './types';

export type MapGameSurfacePropsInput = {
  gameCode: GameCode;
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

function mapVerification(v: VerificationEvidence | null): FairnessUiEvidence | null {
  if (!v) return null;
  const vr = v.verification;
  return {
    ok: vr.seedHashMatch && (vr.resultMatch ?? true),
    hmac: v.server_seed_hash,
    cursor: 0,
    serverSeed: v.server_seed,
  };
}

/** Maps engine state to Lovable `ImportedGameSurfaceProps` (adapter boundary). */
export function mapGameSurfaceProps(input: MapGameSurfacePropsInput): ImportedGameSurfaceProps {
  return {
    gameCode: input.gameCode,
    currency: input.currency,
    stake: input.stake,
    selection: input.selection as unknown as ImportedGameSurfaceProps['selection'],
    clientSeed: input.clientSeed,
    availableBalance: input.availableBalance,
    commitment: input.commitment,
    bet: input.bet,
    verification: mapVerification(input.verification),
    recentBets: normalizeRecentBets(
      input.recentBets.map((row) => ({
        id: row.id,
        game: row.game,
        currency: row.currency,
        stake: row.stake,
        payout: row.payout ?? '0',
        result_payload: {},
        created_at: row.created_at,
      })),
    ),
    busy: input.busy,
    confirmOpen: input.confirmOpen,
    pasteShellConfirm: true,
    onStakeChange: input.onStakeChange,
    onCurrencyChange: input.onCurrencyChange,
    onSelectionChange: (sel) => input.onSelectionChange(sel as unknown as Record<string, unknown>),
    onClientSeedChange: input.onClientSeedChange,
    onPrepareRound: input.onPrepareRound,
    onOpenBetConfirm: input.onOpenBetConfirm,
    onSubmitBet: input.onSubmitBet,
    onCancelBetConfirm: input.onCancelBetConfirm,
  };
}
