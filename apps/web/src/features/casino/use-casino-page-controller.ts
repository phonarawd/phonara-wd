import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import type { GameCode } from '@phonara/game-engine';
import { useAuth } from '../../contexts/auth-context';
import { useWallet } from '../../hooks/use-wallet';
import { useConfirmSnapshot } from '../../hooks/use-confirm-snapshot';
import { isPositiveDecimalInput } from '../../lib/money-input';
import { useT } from '../../lib/i18n';
import { mapGameSurfaceProps } from './map-game-surface-props';
import { GAME_BY_CODE, casinoGamePath } from './game-config';
import { resetAccumulatedSelection } from './reset-accumulated-selection';
import { useCasinoRoundPipeline } from './use-casino-round';
import { loadRecentBets } from './recent-bets';
import { cellsFromText, randomHex } from './helpers';
import type { Currency, RecentBet } from './types';

export function useCasinoPageController(initialGame: GameCode) {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const [gameCode, setGameCode] = useState<GameCode>(initialGame);
  const [currency, setCurrency] = useState<Currency>('PHON');
  const [stake, setStake] = useState(GAME_BY_CODE[initialGame].defaultStake);
  const [selection, setSelection] = useState<Record<string, unknown>>(
    GAME_BY_CODE[initialGame].defaultSelection,
  );
  const [clientSeed, setClientSeed] = useState(() => randomHex());
  const [clientSeedIsAuto, setClientSeedIsAuto] = useState(true);
  const [recentBets, setRecentBets] = useState<RecentBet[]>([]);

  const config = GAME_BY_CODE[gameCode];
  const available = currency === 'PHON' ? wallet?.phon_available : wallet?.usdt_available;

  const resetAccumulatedSelectionState = useCallback(() => {
    setSelection((prev) => resetAccumulatedSelection(gameCode, prev));
  }, [gameCode]);

  const casinoRound = useCasinoRoundPipeline({
    gameCode,
    currency,
    stake,
    selection,
    clientSeed,
    clientSeedIsAuto,
    setClientSeed,
    userId: session?.user.id ?? null,
    onRecentBetsChange: setRecentBets,
    onAccumulatedSelectionReset: resetAccumulatedSelectionState,
  });

  const {
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
  } = casinoRound;

  const canSubmit = Boolean(commitment && isPositiveDecimalInput(stake) && !busy);
  const betFingerprint = commitment
    ? `${commitment.round_id}:${stake}:${currency}:${clientSeed}:${commitment.server_seed_hash}`
    : '';

  const handleConfirmDrift = useCallback(() => {
    toast.warning(t('casino.confirm.inputsChanged'));
  }, [t]);

  const { canConfirm, isDrifted } = useConfirmSnapshot({
    open: confirmOpen,
    fingerprint: betFingerprint,
    onDrift: handleConfirmDrift,
  });

  const confirmNotice = isDrifted ? t('casino.confirm.inputsChanged') : undefined;

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  useEffect(() => {
    setGameCode(initialGame);
    setStake(GAME_BY_CODE[initialGame].defaultStake);
    setSelection(GAME_BY_CODE[initialGame].defaultSelection);
    resetRoundState();
  }, [initialGame, resetRoundState]);

  useEffect(() => {
    if (!session) {
      setRecentBets([]);
      return;
    }
    void loadRecentBets().then(setRecentBets);
  }, [session]);

  const updateSelection = useCallback(
    (key: string, value: string) => {
      setSelection((current) => {
        if (key === 'guesses.0') return { ...current, guesses: [value] };
        if (key === 'revealedCells') return { ...current, revealedCells: cellsFromText(value, 24) };
        if (key === 'rows' || key === 'mineCount') return { ...current, [key]: Number(value) };
        return { ...current, [key]: value };
      });
      resetRoundState();
    },
    [resetRoundState],
  );

  const updateClientSeed = useCallback(
    (value: string) => {
      setClientSeed(value);
      setClientSeedIsAuto(false);
      resetRoundState();
    },
    [resetRoundState],
  );

  const onSelectionChange = useCallback(
    (next: Record<string, unknown>) => {
      setSelection(next);
      resetRoundState();
    },
    [resetRoundState],
  );

  const onStakeChange = useCallback(
    (value: string) => {
      setStake(value);
      resetRoundState();
    },
    [resetRoundState],
  );

  const onCurrencyChange = useCallback(
    (next: Currency) => {
      setCurrency(next);
      resetRoundState();
    },
    [resetRoundState],
  );

  const selectGame = useCallback(
    (next: GameCode) => {
      void navigate({ to: casinoGamePath(next) });
    },
    [navigate],
  );

  const gameSurfaceProps = useMemo(
    () =>
      mapGameSurfaceProps({
        gameCode,
        currency,
        stake,
        selection,
        clientSeed,
        availableBalance: available ?? null,
        commitment,
        bet,
        verification: verificationEvidence,
        recentBets,
        busy,
        confirmOpen,
        onStakeChange,
        onCurrencyChange,
        onSelectionChange,
        onClientSeedChange: updateClientSeed,
        onPrepareRound: () => void prepareRound(),
        onOpenBetConfirm: openBetConfirm,
        onSubmitBet: () => void submitBet(),
        onCancelBetConfirm: cancelBetConfirm,
      }),
    [
      available,
      bet,
      busy,
      cancelBetConfirm,
      clientSeed,
      commitment,
      confirmOpen,
      currency,
      gameCode,
      onCurrencyChange,
      onSelectionChange,
      onStakeChange,
      openBetConfirm,
      prepareRound,
      recentBets,
      selection,
      stake,
      submitBet,
      updateClientSeed,
      verificationEvidence,
    ],
  );

  return {
    t,
    session,
    authLoading,
    walletLoading,
    gameCode,
    currency,
    stake,
    selection,
    clientSeed,
    recentBets,
    config,
    available,
    commitment,
    bet,
    verificationEvidence,
    confirmOpen,
    busy,
    errorKey,
    toastKey,
    canSubmit,
    canConfirm,
    confirmNotice,
    prepareRound,
    submitBet,
    openBetConfirm,
    cancelBetConfirm,
    resetRoundState,
    selectGame,
    updateSelection,
    updateClientSeed,
    gameSurfaceProps,
  };
}
