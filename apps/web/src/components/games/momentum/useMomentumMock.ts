/**
 * Momentum · LOCAL preview hook (LAW 1).
 *
 * Returns canned fixture objects keyed by `(selection.comboBefore,
 * selection.cashOut)` and an optional caller-supplied queue. NO outcome
 * computation: no Math.*, no comparisons against result fields, no
 * arithmetic on result fields. This file is a pure fixture LOOKUP.
 *
 * Engine-swap seam: the route imports this hook by a single line —
 * after Cursor export, replace with `useCasinoRoundPipeline("momentum")`
 * (real engine path).
 *
 * Tested by __tests__/mock-is-fixtures.test.ts (LAW 1 proof) and
 * __tests__/orchestration.test.tsx (combo orchestration correctness).
 */
import { useCallback, useMemo, useRef, useState } from "react";
import type {
  Currency,
  RoundCommitment,
  UiBetView,
  VerificationEvidence,
  BetResponseStatus,
} from "@/games/shared/types";
import { MOMENTUM_FIXTURES, type MomentumFixtureKey } from "./fixtures";
import type {
  MomentumSelection,
  MomentumSubmitOpts,
  MomentumSurfaceProps,
} from "./types";

function fixtureHash(seed: number, len = 32): string {
  let h = seed >>> 0;
  let out = "";
  for (let i = 0; i < len; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out += (h % 256).toString(16).padStart(2, "0");
  }
  return out.slice(0, len * 2);
}

export interface UseMomentumMockOptions {
  /** Ordered fixture keys consumed per submit — for orchestration tests. */
  scenarioQueue?: readonly MomentumFixtureKey[];
}

/** Pure lookup: pick the next fixture key. NO arithmetic on results. */
function pickFixtureKey(
  selection: MomentumSelection,
  queue: readonly MomentumFixtureKey[] | undefined,
  cursor: number,
): MomentumFixtureKey {
  if (queue && cursor < queue.length) {
    const hit = queue[cursor];
    if (hit) return hit;
  }
  const prefix = selection.cashOut ? "cashout-at-" : "play-win-from-";
  const key = `${prefix}${selection.comboBefore}` as MomentumFixtureKey;
  if (key in MOMENTUM_FIXTURES) return key;
  return selection.cashOut ? "cashout-at-0" : "play-win-from-0";
}

export function useMomentumMock(
  options: UseMomentumMockOptions = {},
): MomentumSurfaceProps {
  const [stake, setStake] = useState("10");
  const [currency, setCurrency] = useState<Currency>("PHON");
  const [selection, setSelection] = useState<MomentumSelection>({
    comboBefore: 0,
    cashOut: false,
  });
  const [clientSeed, setClientSeed] = useState(() => fixtureHash(1, 8));
  const [commitment, setCommitment] = useState<RoundCommitment | null>(null);
  const [bet, setBet] = useState<UiBetView | null>(null);
  const [verification, setVerification] =
    useState<VerificationEvidence | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cursorRef = useRef(0);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  const onSubmitBet = useCallback(
    (opts?: MomentumSubmitOpts) => {
      setBusy(true);
      setConfirmOpen(false);
      // Auto-mint commitment if missing (preview convenience). Real
      // adapter keeps commitment + confirm + hash as hard preconditions.
      setCommitment((prev) =>
        prev ?? { round_id: fixtureHash(cursorRef.current + 2, 8), server_seed_hash: fixtureHash(cursorRef.current + 3) },
      );
      const sel: MomentumSelection = {
        ...selectionRef.current,
        cashOut: opts?.cashOut ?? selectionRef.current.cashOut,
      };
      const key = pickFixtureKey(sel, options.scenarioQueue, cursorRef.current);
      cursorRef.current = cursorRef.current + 1;
      const result = MOMENTUM_FIXTURES[key];
      const status: BetResponseStatus = result.won ? "won" : "lost";
      const next: UiBetView = {
        status,
        result: result as unknown as Record<string, unknown>,
        payout: "0",
        multiplier: result.comboMultiplier,
      };
      setBet(next);
      setVerification({
        ok: true,
        hmac: fixtureHash(cursorRef.current + 4, 16),
        cursor: cursorRef.current,
        serverSeed: fixtureHash(cursorRef.current + 5),
      });
      // Selection advances from fixture comboAfter — pure write, no math.
      setSelection({ comboBefore: result.comboAfter, cashOut: false });
      setBusy(false);
      window.setTimeout(() => {
        if (typeof window === "undefined") return;
        setCommitment(null);
      }, 400);
    },
    [options.scenarioQueue],
  );

  const onPrepareRound = useCallback(() => {
    setBusy(true);
    setBet(null);
    setVerification(null);
    window.setTimeout(() => {
      setCommitment({ round_id: fixtureHash(cursorRef.current + 6, 8), server_seed_hash: fixtureHash(cursorRef.current + 7) });
      setBusy(false);
    }, 250);
  }, []);

  return useMemo<MomentumSurfaceProps>(
    () => ({
      gameCode: "momentum",
      currency,
      stake,
      selection,
      clientSeed,
      availableBalance: "10000",
      commitment,
      bet,
      verification,
      recentBets: [],
      busy,
      confirmOpen,
      onStakeChange: setStake,
      onCurrencyChange: setCurrency,
      onSelectionChange: setSelection,
      onClientSeedChange: setClientSeed,
      onPrepareRound,
      onOpenBetConfirm: () => onSubmitBet(),
      onSubmitBet,
      onCancelBetConfirm: () => setConfirmOpen(false),
    }),
    [
      currency,
      stake,
      selection,
      clientSeed,
      commitment,
      bet,
      verification,
      busy,
      confirmOpen,
      onPrepareRound,
      onSubmitBet,
    ],
  );
}
