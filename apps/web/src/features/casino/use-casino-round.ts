/**
 * Casino round pipeline — engine hook for game surfaces (P10 · `p10-casino-replay-and-infra`).
 * Orphan until `/games/*` routes mount — see `dead-controls-display-contract.ts`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { verifyRound, type GameCode } from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';
import type { Json } from '@phonara/shared-types';
import { callRpc } from '../../lib/rpc';
import { walletKeys } from '../../hooks/use-wallet';
import { useClientGatePrechecks } from '../../hooks/use-client-gate-prechecks';
import { errorToKey, randomHex } from './helpers';
const CASINO_CONFIRM_PREF_KEY = 'phonara.settings.casino.confirmDialog';

function getCasinoConfirmPref(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const v = window.localStorage.getItem(CASINO_CONFIRM_PREF_KEY);
    if (v === '1' || v === 'true') return true;
    if (v === '0' || v === 'false') return false;
  } catch {
    // SSR / privacy mode
  }
  return false;
}
import { ACCUMULATED_SELECTION_RESET_MS } from './reset-accumulated-selection';
import { loadRecentBets } from './recent-bets';
import type {
  BetResponse,
  Currency,
  ManualBetResult,
  RecentBet,
  RevealResponse,
  RoundCommitment,
  VerificationEvidence,
} from './types';

export type { AutoBetResult, ManualBetResult, BetResponse } from './types';

export function useCasinoRoundPipeline({
  gameCode,
  currency,
  stake,
  selection,
  clientSeed,
  clientSeedIsAuto,
  setClientSeed,
  userId,
  onRecentBetsChange,
  onAccumulatedSelectionReset,
}: {
  gameCode: GameCode;
  currency: Currency;
  stake: string;
  selection: Record<string, unknown>;
  clientSeed: string;
  clientSeedIsAuto: boolean;
  setClientSeed: (value: string) => void;
  userId: string | null;
  onRecentBetsChange: (rows: RecentBet[]) => void;
  /** §1-H — mines revealedCells / hilo guesses+startCard after prepare or settle. */
  onAccumulatedSelectionReset?: () => void;
}) {
  const queryClient = useQueryClient();
  const { resolveCasinoGameBlocked } = useClientGatePrechecks();
  const gameGate = resolveCasinoGameBlocked(gameCode);
  const casinoBlocked = gameGate.blocked;
  const casinoBlockedKey = gameGate.reasonKey ?? 'gate.killswitch.casinoBlocked';
  const [commitment, setCommitment] = useState<RoundCommitment | null>(null);
  const commitmentRef = useRef<RoundCommitment | null>(null);
  const [bet, setBet] = useState<BetResponse | null>(null);
  const [verificationEvidence, setVerificationEvidence] = useState<VerificationEvidence | null>(
    null,
  );
  /** Persists last settled result for E2E fairness anchor across prepareRound. */
  const [settledResult, setSettledResult] = useState<Record<string, unknown> | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [toastKey, setToastKey] = useState<MessageKey | null>(null);
  const betIdempotencyKeyRef = useRef<string | null>(null);
  const betInFlightRef = useRef(false);
  const selectionResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncCommitment = useCallback((round: RoundCommitment | null) => {
    commitmentRef.current = round;
    setCommitment(round);
  }, []);

  const clearSelectionResetTimer = useCallback(() => {
    if (selectionResetTimerRef.current) {
      clearTimeout(selectionResetTimerRef.current);
      selectionResetTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearSelectionResetTimer(), [clearSelectionResetTimer]);

  const scheduleAccumulatedSelectionReset = useCallback(() => {
    if (!onAccumulatedSelectionReset) return;
    clearSelectionResetTimer();
    selectionResetTimerRef.current = setTimeout(() => {
      onAccumulatedSelectionReset();
      selectionResetTimerRef.current = null;
    }, ACCUMULATED_SELECTION_RESET_MS);
  }, [clearSelectionResetTimer, onAccumulatedSelectionReset]);

  const resetRoundState = useCallback(() => {
    clearSelectionResetTimer();
    syncCommitment(null);
    setBet(null);
    setVerificationEvidence(null);
    setSettledResult(null);
    setConfirmOpen(false);
    setErrorKey(null);
    setToastKey(null);
    betIdempotencyKeyRef.current = null;
  }, [clearSelectionResetTimer, syncCommitment]);

  const prepareRound = useCallback(
    async (
      nextGame = gameCode,
      options: { preserveEvidence?: boolean } = {},
    ): Promise<RoundCommitment | null> => {
      if (!options.preserveEvidence) {
        onAccumulatedSelectionReset?.();
      }
      setBusy(true);
      setErrorKey(null);
      setBet(null);
      if (!options.preserveEvidence) {
        setVerificationEvidence(null);
      }
      try {
        const round = (await callRpc('rpc_open_game_round', {
          p_game: nextGame,
        })) as unknown as RoundCommitment;
        syncCommitment(round);
        if (clientSeedIsAuto) {
          setClientSeed(randomHex());
        }
        setToastKey('casino.toast.hashReady');
        return round;
      } catch (error) {
        setErrorKey(errorToKey(error));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [clientSeedIsAuto, gameCode, onAccumulatedSelectionReset, setClientSeed, syncCommitment],
  );

  const submitBet = useCallback(async (stakeOverride?: string): Promise<BetResponse | null> => {
    const round = commitmentRef.current;
    if (!round || betInFlightRef.current || !betIdempotencyKeyRef.current) return null;
    if (casinoBlocked) {
      setErrorKey(casinoBlockedKey);
      setConfirmOpen(false);
      return null;
    }
    const idempotencyKey = betIdempotencyKeyRef.current;
    const fireStake = stakeOverride ?? stake;
    betInFlightRef.current = true;
    setBusy(true);
    setErrorKey(null);
    setVerificationEvidence(null);
    setConfirmOpen(false);
    try {
      const placed = (await callRpc('rpc_place_game_bet', {
        p_round_id: round.round_id,
        p_currency: currency,
        p_stake: fireStake,
        p_selection: selection as Json,
        p_client_seed: clientSeed,
        p_idempotency_key: idempotencyKey,
      })) as unknown as BetResponse;
      setSettledResult(placed.result);
      const revealed = (await callRpc('rpc_reveal_game_round', {
        p_round_id: round.round_id,
      })) as unknown as RevealResponse;
      const fullResult = revealed.result as Record<string, unknown>;
      const verified = await verifyRound({
        game: gameCode,
        serverSeed: revealed.server_seed,
        serverSeedHash: round.server_seed_hash,
        clientSeed,
        nonce: 1,
        selection,
        expectedResult: fullResult,
      });
      setBet(placed);
      setVerificationEvidence({
        server_seed_hash: round.server_seed_hash,
        server_seed: revealed.server_seed,
        result: fullResult,
        verification: verified,
      });
      setConfirmOpen(false);
      setToastKey(placed.status === 'won' ? 'casino.toast.won' : 'casino.toast.settled');
      await queryClient.invalidateQueries({ queryKey: walletKeys.all(userId) });
      onRecentBetsChange(await loadRecentBets());
      scheduleAccumulatedSelectionReset();
      await prepareRound(gameCode, { preserveEvidence: true });
      return placed;
    } catch (error) {
      setErrorKey(errorToKey(error));
      setConfirmOpen(false);
      return null;
    } finally {
      setBusy(false);
      betInFlightRef.current = false;
      betIdempotencyKeyRef.current = null;
    }
  }, [
    clientSeed,
    currency,
    gameCode,
    onRecentBetsChange,
    prepareRound,
    queryClient,
    scheduleAccumulatedSelectionReset,
    selection,
    stake,
    userId,
    casinoBlocked,
    casinoBlockedKey,
  ]);

  const openBetConfirm = useCallback(() => {
    betIdempotencyKeyRef.current ??= `casino:${randomHex()}`;
    setConfirmOpen(true);
  }, []);

  /** One-tap (pref OFF) or modal (pref ON) — manual bet entry. */
  const requestBet = useCallback(async (): Promise<ManualBetResult> => {
    if (!commitmentRef.current || betInFlightRef.current) return 'blocked';
    if (getCasinoConfirmPref()) {
      openBetConfirm();
      return 'confirm_opened';
    }
    betIdempotencyKeyRef.current = `casino:${randomHex()}`;
    const placed = await submitBet();
    return placed ? 'placed' : 'blocked';
  }, [openBetConfirm, submitBet]);

  /**
   * Auto-only: prepare-if-needed + submit; bypasses confirm pref.
   * `stakeOverride` is required for auto-bet loops so martingale/next stake is not stale React stake.
   */
  const autoBet = useCallback(
    async (stakeOverride?: string): Promise<BetResponse | null> => {
      if (betInFlightRef.current) return null;
      if (casinoBlocked) {
        setErrorKey(casinoBlockedKey);
        return null;
      }

      let round = commitmentRef.current;
      if (!round) {
        round = await prepareRound(gameCode);
        if (!round) return null;
      }

      betIdempotencyKeyRef.current = `casino:${randomHex()}`;
      return submitBet(stakeOverride);
    },
    [casinoBlocked, casinoBlockedKey, gameCode, prepareRound, submitBet],
  );

  const cancelBetConfirm = useCallback(() => {
    if (betInFlightRef.current) return;
    betIdempotencyKeyRef.current = null;
    setConfirmOpen(false);
  }, []);

  return {
    commitment,
    bet,
    verificationEvidence,
    settledResult,
    confirmOpen,
    busy,
    errorKey,
    toastKey,
    prepareRound,
    submitBet,
    requestBet,
    autoBet,
    openBetConfirm,
    cancelBetConfirm,
    resetRoundState,
  };
}
