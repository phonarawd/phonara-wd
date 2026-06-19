/**
 * Momentum · LOCAL TYPE MIRROR (G#11).
 *
 * The PHONARA Momentum ENGINE is FINAL in Cursor but its contract types
 * are not yet present in this Lovable canvas (GameCode union has no
 * 'momentum' branch). This file mirrors the engine-side TYPES locally
 * so the UI compiles + tests run, with ZERO touches to shared/**.
 *
 * Engine-swap seam: src/routes/casino.momentum.tsx — replacing the
 * `useMomentumMock()` import with `useCasinoRoundPipeline("momentum")`
 * is a one-line change after Cursor export.
 *
 * NO outcome computation lives in this file or in fixtures.ts /
 * useMomentumMock.ts — those return canned objects ONLY.
 */
import type {
  Currency,
  RoundCommitment,
  UiBetView,
  FairnessUiEvidence,
  PhonaraVerificationEvidence,
  RecentBetStripRow,
  PhonaraRecentBet,
} from "@/games/shared/types";

/** Selection — auto-only `cashOut` flag + current combo step. */
export interface MomentumSelection {
  /** Current combo step BEFORE the round (0..). */
  comboBefore: number;
  /** When true, this round banks the chain and resets to 0. */
  cashOut: boolean;
}

/**
 * Engine result mirror — what `bet.result` carries on settle.
 *  - play win: comboAfter = comboBefore + 1, comboMultiplier: step mult,
 *              roll in [52.00, 99.99] (engine emits hand-pick of 0–99 range).
 *  - play loss: comboAfter: 0, won: false, comboMultiplier: "1.00",
 *               roll in [0.00, 51.99].
 *  - cashout: cashedOut: true, comboAfter: 0, roll: 0,
 *             totalMultiplier: banked mult (engine truth).
 */
export interface MomentumResult {
  comboAfter: number;
  comboMultiplier: string;
  /** Present ONLY when cashedOut === true. */
  totalMultiplier?: string;
  won: boolean;
  cashedOut: boolean;
  /** Engine roll 0–99.99 (play) · 0 (cashout). UI staged reveal ≤900ms. */
  roll: number;
}

/** Auto policy — early/mid/greedy → cashOutAt 2/5/10 (LOCK v0.1). */
export type MomentumAutoPolicy = "early" | "mid" | "greedy";
export const MOMENTUM_POLICY_CASHOUT_AT: Record<MomentumAutoPolicy, number> = {
  early: 2,
  mid: 5,
  greedy: 10,
};

/** Submit-bet options — Momentum extends the canonical no-arg shape with
 * an optional cashOut override so a cash-out tap reads the latest state. */
export type MomentumSubmitOpts = { cashOut?: boolean };

/**
 * Game surface props — mirrors `ImportedGameSurfaceProps<G>` shape for
 * the missing `momentum` GameCode without touching shared/types.ts.
 */
export interface MomentumSurfaceProps {
  gameCode: "momentum";
  currency: Currency;
  stake: string;
  selection: MomentumSelection;
  clientSeed: string;
  availableBalance: string | null;

  commitment: RoundCommitment | null;
  bet: UiBetView | null;
  verification: PhonaraVerificationEvidence | FairnessUiEvidence | null;
  recentBets: RecentBetStripRow[] | PhonaraRecentBet[];

  busy: boolean;
  confirmOpen: boolean;

  onStakeChange: (v: string) => void;
  onCurrencyChange: (c: Currency) => void;
  onSelectionChange: (sel: MomentumSelection) => void;
  onClientSeedChange: (seed: string) => void;

  onPrepareRound: () => void;
  onOpenBetConfirm: () => void;
  onSubmitBet: (opts?: MomentumSubmitOpts) => void;
  onCancelBetConfirm: () => void;
}

/** Auto-slot per-game contract — mirrors AutoSlotProps<G> shape. */
export interface MomentumAutoSlotProps {
  policy: MomentumAutoPolicy;
  onPolicyChange: (p: MomentumAutoPolicy) => void;
}
