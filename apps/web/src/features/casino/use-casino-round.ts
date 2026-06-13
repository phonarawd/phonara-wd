import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { verifyRound, type GameCode } from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';
import type { Json } from '@phonara/shared-types';
import { callRpc } from '../../lib/rpc';
import { walletKeys } from '../../hooks/use-wallet';
import { errorToKey, randomHex } from './helpers';
import { loadRecentBets } from './recent-bets';
import type {
  BetResponse,
  Currency,
  RecentBet,
  RevealResponse,
  RoundCommitment,
  VerificationEvidence,
} from './types';

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
}) {
  const queryClient = useQueryClient();
  const [commitment, setCommitment] = useState<RoundCommitment | null>(null);
  const [bet, setBet] = useState<BetResponse | null>(null);
  const [verificationEvidence, setVerificationEvidence] = useState<VerificationEvidence | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [toastKey, setToastKey] = useState<MessageKey | null>(null);
  const betIdempotencyKeyRef = useRef<string | null>(null);
  const betInFlightRef = useRef(false);

  const resetRoundState = useCallback(() => {
    setCommitment(null);
    setBet(null);
    setVerificationEvidence(null);
    setConfirmOpen(false);
    setErrorKey(null);
    setToastKey(null);
    betIdempotencyKeyRef.current = null;
  }, []);

  const prepareRound = useCallback(async (
    nextGame = gameCode,
    options: { preserveEvidence?: boolean } = {},
  ) => {
    setBusy(true);
    setErrorKey(null);
    setBet(null);
    if (!options.preserveEvidence) {
      setVerificationEvidence(null);
    }
    try {
      const round = await callRpc('rpc_open_game_round', { p_game: nextGame }) as unknown as RoundCommitment;
      setCommitment(round);
      if (clientSeedIsAuto) {
        setClientSeed(randomHex());
      }
      setToastKey('casino.toast.hashReady');
    } catch (error) {
      setErrorKey(errorToKey(error));
    } finally {
      setBusy(false);
    }
  }, [clientSeedIsAuto, gameCode, setClientSeed]);

  const submitBet = useCallback(async () => {
    if (!commitment || betInFlightRef.current || !betIdempotencyKeyRef.current) return;
    const idempotencyKey = betIdempotencyKeyRef.current ?? (betIdempotencyKeyRef.current = `casino:${randomHex()}`);
    betInFlightRef.current = true;
    setBusy(true);
    setErrorKey(null);
    setVerificationEvidence(null);
    try {
      const placed = await callRpc('rpc_place_game_bet', {
        p_round_id: commitment.round_id,
        p_currency: currency,
        p_stake: stake,
        p_selection: selection as Json,
        p_client_seed: clientSeed,
        p_idempotency_key: idempotencyKey,
      }) as unknown as BetResponse;
      const revealed = await callRpc('rpc_reveal_game_round', { p_round_id: commitment.round_id }) as unknown as RevealResponse;
      const verified = await verifyRound({
        game: gameCode,
        serverSeed: revealed.server_seed,
        serverSeedHash: commitment.server_seed_hash,
        clientSeed,
        nonce: 1,
        selection,
        expectedResult: placed.result,
      });
      setBet(placed);
      setVerificationEvidence({
        server_seed_hash: commitment.server_seed_hash,
        server_seed: revealed.server_seed,
        result: placed.result,
        verification: verified,
      });
      setConfirmOpen(false);
      setToastKey(placed.status === 'won' ? 'casino.toast.won' : 'casino.toast.settled');
      await queryClient.invalidateQueries({ queryKey: walletKeys.all(userId) });
      onRecentBetsChange(await loadRecentBets());
      await prepareRound(gameCode, { preserveEvidence: true });
    } catch (error) {
      setErrorKey(errorToKey(error));
      setConfirmOpen(false);
    } finally {
      setBusy(false);
      betInFlightRef.current = false;
      betIdempotencyKeyRef.current = null;
    }
  }, [
    clientSeed,
    commitment,
    currency,
    gameCode,
    onRecentBetsChange,
    prepareRound,
    queryClient,
    selection,
    stake,
    userId,
  ]);

  const openBetConfirm = useCallback(() => {
    betIdempotencyKeyRef.current ??= `casino:${randomHex()}`;
    setConfirmOpen(true);
  }, []);

  const cancelBetConfirm = useCallback(() => {
    if (betInFlightRef.current) return;
    betIdempotencyKeyRef.current = null;
    setConfirmOpen(false);
  }, []);

  return {
    commitment,
    bet,
    verificationEvidence,
    confirmOpen,
    busy,
    errorKey,
    toastKey,
    prepareRound,
    submitBet,
    openBetConfirm,
    cancelBetConfirm,
    resetRoundState,
  };
}
