import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { GameCode } from '@phonara/game-engine';
import { toDecimal } from '@phonara/money';

import { getGameMeta, type CasinoGameId } from '@/data/casino-game-meta';
import {
  CASINO_STAKE_CURRENCY_EXPOSURE,
  P10_CASINO_REPLAY_AND_INFRA_TODO,
  casinoGameSlugFromCode,
  deriveCasinoWinTier,
  type CasinoWinTier,
} from '@/domain/casino-outcome-replay-contract';
import {
  isCasinoBatchAGame,
  P10_GAMES_BATCH_A_TODO,
} from '@/domain/casino-games-batch-a-display-contract';
import {
  isCasinoBatchBGame,
  P10_GAMES_BATCH_B_TODO,
} from '@/domain/casino-games-batch-b-display-contract';
import {
  isCasinoBatchCGame,
  P10_GAMES_BATCH_C_TODO,
} from '@/domain/casino-games-batch-c-display-contract';
import {
  isCasinoBatchDGame,
  P10_GAMES_BATCH_D_TODO,
} from '@/domain/casino-games-batch-d-display-contract';
import { isEwE23UiLivePlayGame } from '@/domain/ew-e23-ui-casino-live-unlocks-display-contract';
import { EW_E23_PROGRESSIVE_GAMES } from '@/domain/ew-e23-casino-live-display-contract';
import { CASINO_E2E_TESTIDS } from '@/features/casino/casino-e2e-testids';
import { GAME_BY_CODE } from '@/features/casino/game-config';
import { randomHex } from '@/features/casino/helpers';
import type { Currency, RecentBet } from '@/features/casino/types';
import {
  createAutoBetSession,
  markAutoBetStopRequested,
  stepAutoBetSession,
  useAutoBetQueue,
  type AutoBetConfig,
  type AutoBetSessionState,
} from '@/features/casino/use-auto-bet-queue';
import { useCasinoConnectionStatus } from '@/features/casino/use-casino-connection-status';
import { useCasinoFiatHint } from '@/features/casino/use-casino-fiat-hint';
import { useCasinoGpuTier } from '@/features/casino/use-casino-gpu-tier';
import { useCasinoRoundPipeline } from '@/features/casino/use-casino-round';
import {
  useLiveCrashCashout,
  useLiveCrashCurrent,
  useLiveCrashPlaceBet,
} from '@/features/casino/use-live-crash';
import {
  useProgressiveCashout,
  useProgressiveStart,
  useProgressiveStep,
  type ProgressiveGame,
  type ProgressiveSessionPublic,
} from '@/features/casino/use-progressive-round';
import { LAUNCH_GATES } from '@/lib/launch-gates';
import { translateError } from '@/lib/translate-error';
import { useAuth } from '@/contexts/auth-context';
import { useWallet } from '@/hooks/use-wallet';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import {
  FiatHintDisclaimer,
  FiatHintSecondaryLine,
  MoneyDisplayWithFiatHintSlot,
} from '@/product/primitives/money-display-with-fiat-hint';
import {
  SpendCurrencySelector,
  type SpendCurrency,
} from '@/product/primitives/spend-currency-selector';
import { productToast } from '@/product/primitives/toast-zone';
import { AutoBetPanel } from '@/product/surfaces/games/auto-bet-panel';
import { BetModeTabs, type CasinoBetMode } from '@/product/surfaces/games/bet-mode-tabs';
import { CasinoGameStage } from '@/product/surfaces/games/casino-game-stage';
import { CasinoMoneyWithFiatHint } from '@/product/surfaces/games/casino-money-with-fiat-hint';
import { CasinoTrustStrip } from '@/product/surfaces/games/casino-trust-strip';
import { GameOutcomeLayer } from '@/product/surfaces/games/game-outcome-layer';
import { GameSelectionFields } from '@/product/surfaces/games/game-selection-fields';
import { PfStrip } from '@/product/surfaces/games/pf-strip';
import { WinTierOverlay } from '@/product/surfaces/games/win-tier-overlay';
import { playCasinoWinCue } from '@/product/surfaces/games/casino-sound';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';
import { P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO } from '@/domain/fiat-reference-display-contract';
import type { BlackjackMove, HiLoGuess } from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';

type CasinoPlayMode = 'oneshot' | 'live';

function isProgressiveGame(code: string): code is ProgressiveGame {
  return (EW_E23_PROGRESSIVE_GAMES as readonly string[]).includes(code);
}

function asLiveRevealed(publicState: Record<string, unknown>): number[] {
  const raw = publicState['revealedCells'];
  if (!Array.isArray(raw)) return [];
  return raw.filter((n): n is number => typeof n === 'number' && Number.isInteger(n));
}

function profitDeltaFromBet(stake: string, payout: string, won: boolean): string {
  try {
    if (!won) return toDecimal(stake, 'stake').neg().toFixed();
    return toDecimal(payout, 'payout').sub(toDecimal(stake, 'stake')).toFixed();
  } catch {
    return '0';
  }
}

function multiplierFromBet(stake: string, payout: string): string {
  try {
    const s = toDecimal(stake, 'stake');
    if (s.isZero()) return '0';
    return toDecimal(payout, 'payout').div(s).toFixed(2);
  } catch {
    return '0';
  }
}

export type CasinoGameShellProps = {
  gameCode: GameCode;
};

/** Shared chrome for `/games/$gameCode` — stake currency · AutoBet · PF · WinTier · stage slot. */
export function CasinoGameShell({ gameCode }: CasinoGameShellProps) {
  const t = useT();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const { wallet } = useWallet();
  const { lockSession, unlockSession, sessionLocked, showDisclaimer, hintFor } =
    useCasinoFiatHint();
  const config = GAME_BY_CODE[gameCode];
  const gpuTier = useCasinoGpuTier();
  const connectionStatus = useCasinoConnectionStatus(userId);
  const gameMeta = useMemo(
    () => getGameMeta(casinoGameSlugFromCode(gameCode) as CasinoGameId),
    [gameCode],
  );

  const [currency, setCurrency] = useState<SpendCurrency>('USDT');
  const [stake, setStake] = useState(config.defaultStake);
  const [selection, setSelection] = useState<Record<string, unknown>>(() => ({
    ...config.defaultSelection,
  }));
  const [clientSeed, setClientSeed] = useState(() => randomHex());
  const [clientSeedIsAuto] = useState(true);
  const [betMode, setBetMode] = useState<CasinoBetMode>('manual');
  const [recentBets, setRecentBets] = useState<RecentBet[]>([]);
  const [winTier, setWinTier] = useState<CasinoWinTier>('none');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [lastPayout, setLastPayout] = useState('0');
  const [lastStake, setLastStake] = useState(config.defaultStake);
  const [lastMultiplier, setLastMultiplier] = useState('0');

  const [autoConfig, setAutoConfig] = useState<AutoBetConfig>(() => ({
    count: 10,
    stopOnProfit: '',
    stopOnLoss: '',
    onWinMode: 'reset',
    onLossMode: 'reset',
    onWinIncreasePercent: '50',
    onLossIncreasePercent: '50',
    baseStake: config.defaultStake,
  }));

  const casinoLiveLive = LAUNCH_GATES.casinoLiveLive;
  const livePlaySupported = casinoLiveLive && isEwE23UiLivePlayGame(gameCode);
  const [playMode, setPlayMode] = useState<CasinoPlayMode>('oneshot');
  const liveMode = livePlaySupported && playMode === 'live';
  const [progressiveSession, setProgressiveSession] = useState<ProgressiveSessionPublic | null>(
    null,
  );
  const [liveCrashBetId, setLiveCrashBetId] = useState<string | null>(null);
  const [liveErrorKey, setLiveErrorKey] = useState<MessageKey | null>(null);

  const progressiveStart = useProgressiveStart();
  const progressiveStep = useProgressiveStep();
  const progressiveCashout = useProgressiveCashout();
  const liveCrashCurrent = useLiveCrashCurrent(liveMode && gameCode === 'crash');
  const liveCrashPlace = useLiveCrashPlaceBet();
  const liveCrashCashout = useLiveCrashCashout();

  const stageRef = useRef<CasinoStageHandle | null>(null);
  const lastPlayedBetIdRef = useRef<string | null>(null);
  const autoQueue = useAutoBetQueue(stake);

  const onAccumulatedSelectionReset = useCallback(() => {
    setSelection({ ...GAME_BY_CODE[gameCode].defaultSelection });
  }, [gameCode]);

  const activeStake = betMode === 'auto' ? autoQueue.nextStake : stake;

  const pipeline = useCasinoRoundPipeline({
    gameCode,
    currency: currency as Currency,
    stake: activeStake,
    selection,
    clientSeed,
    clientSeedIsAuto,
    setClientSeed,
    userId,
    onRecentBetsChange: setRecentBets,
    onAccumulatedSelectionReset,
  });

  useEffect(() => {
    document.title = `${t(config.labelKey)} — PHONARA`;
  }, [config.labelKey, t]);

  useEffect(() => {
    const next = GAME_BY_CODE[gameCode];
    setStake(next.defaultStake);
    setSelection({ ...next.defaultSelection });
    setAutoConfig((prev) => ({ ...prev, baseStake: next.defaultStake }));
    autoQueue.reset(next.defaultStake);
    pipeline.resetRoundState();
    setWinTier('none');
    setOverlayOpen(false);
    setLastStake(next.defaultStake);
    lastPlayedBetIdRef.current = null;
    stageRef.current?.reset();
    setPlayMode('oneshot');
    setProgressiveSession(null);
    setLiveCrashBetId(null);
    setLiveErrorKey(null);
    unlockSession();
    // Reset when navigating between game codes only.
  }, [gameCode]);

  useEffect(() => {
    return () => {
      unlockSession();
    };
  }, [unlockSession]);

  const balanceAmount =
    currency === 'PHON' ? (wallet?.phon_available ?? '0') : (wallet?.usdt_available ?? '0');

  const verificationMatch = useMemo(() => {
    const v = pipeline.verificationEvidence?.verification;
    if (!v) return null;
    return v.seedHashMatch && v.resultMatch !== false;
  }, [pipeline.verificationEvidence]);

  const presentSettle = useCallback((payout: string, status: string, settledStake: string) => {
    const tier = deriveCasinoWinTier({ status, payout, stake: settledStake });
    setWinTier(tier);
    setLastPayout(payout);
    setLastStake(settledStake);
    setLastMultiplier(multiplierFromBet(settledStake, payout));
    if (tier === 'big' || tier === 'mega') {
      setOverlayOpen(true);
      playCasinoWinCue(tier);
    }
  }, []);

  const handleManualBet = useCallback(async () => {
    lockSession();
    const result = await pipeline.requestBet();
    if (result !== 'placed') {
      unlockSession();
      return;
    }
    // bet state updates via pipeline; effect below presents when bet lands
  }, [lockSession, pipeline, unlockSession]);

  const applyProgressiveResult = useCallback(
    (session: ProgressiveSessionPublic) => {
      setProgressiveSession(session.status === 'active' ? session : null);
      if (session.status === 'active') return;
      const payout = session.payout ?? '0';
      const status = session.status === 'cashed_out' || Number(payout) > 0 ? 'won' : 'lost';
      presentSettle(payout, status, session.stake);
      void stageRef.current?.playOutcome(session.public_state ?? {});
      unlockSession();
    },
    [presentSettle, unlockSession],
  );

  const handleLiveStart = useCallback(async () => {
    setLiveErrorKey(null);
    lockSession();
    try {
      if (gameCode === 'crash') {
        const placed = await liveCrashPlace.mutateAsync({
          currency,
          stake: activeStake,
          autoCashout: String(selection['autoCashout'] ?? '2'),
          clientSeed,
          idempotencyKey: crypto.randomUUID(),
        });
        setLiveCrashBetId(placed.bet_id);
        if (placed.status !== 'pending') {
          presentSettle(placed.payout ?? '0', placed.status, activeStake);
          unlockSession();
        }
        return;
      }
      if (!isProgressiveGame(gameCode)) {
        unlockSession();
        return;
      }
      const init =
        gameCode === 'mines'
          ? { mineCount: Number(selection['mineCount'] ?? 3) }
          : gameCode === 'hilo'
            ? {
                startCard:
                  typeof selection['startCard'] === 'number' ? selection['startCard'] : null,
              }
            : {};
      const started = await progressiveStart.mutateAsync({
        game: gameCode,
        currency,
        stake: activeStake,
        init,
        clientSeed,
        idempotencyKey: crypto.randomUUID(),
      });
      setProgressiveSession(started);
      if (started.status !== 'active') {
        applyProgressiveResult(started);
      }
    } catch (error) {
      setLiveErrorKey(translateError(error) as MessageKey);
      unlockSession();
    }
  }, [
    activeStake,
    applyProgressiveResult,
    clientSeed,
    currency,
    gameCode,
    liveCrashPlace,
    lockSession,
    presentSettle,
    progressiveStart,
    selection,
    unlockSession,
  ]);

  const handleLiveCashout = useCallback(() => {
    void (async () => {
      try {
        if (gameCode === 'crash' && liveCrashBetId) {
          const result = await liveCrashCashout.mutateAsync({
            betId: liveCrashBetId,
            idempotencyKey: crypto.randomUUID(),
          });
          presentSettle(result.payout ?? '0', result.status, activeStake);
          setLiveCrashBetId(null);
          unlockSession();
          return;
        }
        if (progressiveSession?.session_id) {
          const result = await progressiveCashout.mutateAsync({
            sessionId: progressiveSession.session_id,
            idempotencyKey: crypto.randomUUID(),
          });
          applyProgressiveResult(result);
        }
      } catch (error) {
        setLiveErrorKey(translateError(error) as MessageKey);
        productToast.show({ zone: 'strict', key: translateError(error) });
      }
    })();
  }, [
    activeStake,
    applyProgressiveResult,
    gameCode,
    liveCrashBetId,
    liveCrashCashout,
    presentSettle,
    progressiveCashout,
    progressiveSession,
    unlockSession,
  ]);

  const handleLiveRevealCell = useCallback(
    (cell: number) => {
      if (!progressiveSession?.session_id) return;
      void (async () => {
        try {
          const result = await progressiveStep.mutateAsync({
            sessionId: progressiveSession.session_id,
            action: { cell },
            idempotencyKey: crypto.randomUUID(),
          });
          const revealed = asLiveRevealed(result.public_state);
          setSelection((prev) => ({ ...prev, revealedCells: revealed }));
          applyProgressiveResult(result);
        } catch (error) {
          setLiveErrorKey(translateError(error) as MessageKey);
        }
      })();
    },
    [applyProgressiveResult, progressiveSession, progressiveStep],
  );

  const handleLiveGuess = useCallback(
    (guess: HiLoGuess) => {
      if (!progressiveSession?.session_id) return;
      void (async () => {
        try {
          const result = await progressiveStep.mutateAsync({
            sessionId: progressiveSession.session_id,
            action: { guess },
            idempotencyKey: crypto.randomUUID(),
          });
          applyProgressiveResult(result);
        } catch (error) {
          setLiveErrorKey(translateError(error) as MessageKey);
        }
      })();
    },
    [applyProgressiveResult, progressiveSession, progressiveStep],
  );

  const handleLiveMove = useCallback(
    (move: BlackjackMove) => {
      if (!progressiveSession?.session_id) return;
      void (async () => {
        try {
          const result = await progressiveStep.mutateAsync({
            sessionId: progressiveSession.session_id,
            action: { move },
            idempotencyKey: crypto.randomUUID(),
          });
          applyProgressiveResult(result);
        } catch (error) {
          setLiveErrorKey(translateError(error) as MessageKey);
        }
      })();
    },
    [applyProgressiveResult, progressiveSession, progressiveStep],
  );

  useEffect(() => {
    if (!pipeline.bet) return;
    presentSettle(pipeline.bet.payout, pipeline.bet.status, activeStake);
    if (lastPlayedBetIdRef.current === pipeline.bet.bet_id) return;
    lastPlayedBetIdRef.current = pipeline.bet.bet_id;
    // Replay must not block next bet / auto fire (§23.4 · §23.8).
    void stageRef.current?.playOutcome(pipeline.bet.result);
  }, [activeStake, pipeline.bet, presentSettle]);

  const handleAutoStart = useCallback(() => {
    const cfg = { ...autoConfig, baseStake: stake };
    // Double-Start guard + UI mirror; loop truth is local session below.
    if (!autoQueue.start(cfg)) return;
    const initial = createAutoBetSession(cfg);
    if (!initial) {
      autoQueue.reset(stake);
      return;
    }

    // Fiat#11 — lock once at auto session open; spins reuse the same rate snapshot.
    lockSession();

    void (async () => {
      let session: AutoBetSessionState = initial;
      let guard = 0;
      while (guard < 200) {
        guard += 1;
        if (autoQueue.isStopRequested()) {
          session = markAutoBetStopRequested(session);
        }
        const fireStake = session.nextStake;
        const placed = await pipeline.autoBet(fireStake);
        if (!placed) {
          autoQueue.reset(stake);
          break;
        }
        const { state, decision } = stepAutoBetSession(session, {
          profitDelta: profitDeltaFromBet(fireStake, placed.payout, placed.status === 'won'),
          won: placed.status === 'won',
        });
        session = state;
        autoQueue.syncSession(session);
        presentSettle(placed.payout, placed.status, fireStake);
        if (decision === 'stop') break;
      }
      unlockSession();
    })();
  }, [autoConfig, autoQueue, lockSession, pipeline, presentSettle, stake, unlockSession]);

  const lockStake = autoQueue.isActive;

  const stakeHint = hintFor(stake, currency);

  return (
    <section
      className="mx-auto flex w-full max-w-5xl flex-col gap-4 py-4 md:py-6"
      data-testid="casino-game-shell"
      data-owner-todo={P10_CASINO_REPLAY_AND_INFRA_TODO}
      data-batch-a-todo={isCasinoBatchAGame(gameCode) ? P10_GAMES_BATCH_A_TODO : undefined}
      data-batch-b-todo={isCasinoBatchBGame(gameCode) ? P10_GAMES_BATCH_B_TODO : undefined}
      data-batch-c-todo={isCasinoBatchCGame(gameCode) ? P10_GAMES_BATCH_C_TODO : undefined}
      data-batch-d-todo={isCasinoBatchDGame(gameCode) ? P10_GAMES_BATCH_D_TODO : undefined}
      data-fiat-hint-todo={P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO}
      data-casino-fiat-session-locked={sessionLocked ? 'true' : 'false'}
      data-game-code={gameCode}
      data-stake-currency-exposure={CASINO_STAKE_CURRENCY_EXPOSURE}
      data-play-mode={liveMode ? 'live' : 'oneshot'}
      data-casino-live-unlocked={casinoLiveLive ? 'true' : 'false'}
      data-gpu-tier={gpuTier}
    >
      <MoneyDisplayWithFiatHintSlot disclaimerSlot={showDisclaimer ? <FiatHintDisclaimer /> : null}>
        <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <Link
              to="/casino"
              className="text-accent text-sm font-medium no-underline"
              data-testid="casino-shell-back-lobby"
            >
              {t('casino.subnav.lobby')}
            </Link>
            <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
              {t(config.labelKey)}
            </h1>
            <p className="text-foreground-muted m-0 text-sm leading-relaxed">
              {t(config.descriptionKey)}
            </p>
          </div>
          <div
            className="border-line bg-surface-raised flex flex-col gap-1 rounded-md border px-3 py-2"
            data-testid="casino-shell-balance"
          >
            <span className="text-foreground-muted text-xs">{t('casino.rocket.balance')}</span>
            <CasinoMoneyWithFiatHint
              amount={balanceAmount}
              currency={currency}
              showCurrency
              role="stake"
            />
          </div>
        </header>

        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          <div className="relative flex flex-col gap-3">
            <CasinoGameStage
              ref={stageRef}
              gameCode={gameCode}
              selection={selection}
              onSelectionChange={setSelection}
              selectionDisabled={
                lockStake ||
                pipeline.busy ||
                progressiveStart.isPending ||
                progressiveStep.isPending ||
                liveCrashPlace.isPending
              }
              liveControls={
                liveMode
                  ? {
                      liveMode: true,
                      liveSessionActive:
                        Boolean(progressiveSession) ||
                        (gameCode === 'crash' && Boolean(liveCrashBetId)),
                      liveCashoutBusy: progressiveCashout.isPending || liveCrashCashout.isPending,
                      liveMultiplier: liveCrashCurrent.data?.round?.current_multiplier ?? null,
                      liveRoundStatus: liveCrashCurrent.data?.round?.status ?? null,
                      onLiveCashout: handleLiveCashout,
                      onLiveRevealCell: handleLiveRevealCell,
                      onLiveGuess: handleLiveGuess,
                      onLiveMove: handleLiveMove,
                    }
                  : undefined
              }
            />
            {overlayOpen ? (
              <WinTierOverlay
                tier={winTier}
                payout={lastPayout}
                multiplier={lastMultiplier}
                currency={currency}
                autoBetActive={autoQueue.isActive}
                onSkip={() => setOverlayOpen(false)}
              />
            ) : null}
            {pipeline.bet ? (
              <GameOutcomeLayer
                tier={winTier}
                payout={lastPayout}
                stake={lastStake}
                currency={currency}
              />
            ) : null}
            <CasinoTrustStrip
              rtp={gameMeta.rtp}
              connectionStatus={connectionStatus.status}
              connectionDisconnected={connectionStatus.disconnected}
            />
            <PfStrip
              serverSeedHash={pipeline.commitment?.server_seed_hash ?? null}
              clientSeed={clientSeed}
              verificationMatch={verificationMatch}
            />
          </div>

          <aside className="border-line bg-surface flex flex-col gap-4 rounded-md border p-4">
            {livePlaySupported ? (
              <div
                className="flex gap-2"
                role="group"
                aria-label={t('casino.playMode.live')}
                data-testid="casino-play-mode"
              >
                <Button
                  type="button"
                  size="sm"
                  variant={playMode === 'oneshot' ? 'primary' : 'secondary'}
                  data-testid="casino-play-mode-oneshot"
                  disabled={Boolean(progressiveSession) || Boolean(liveCrashBetId)}
                  onClick={() => setPlayMode('oneshot')}
                >
                  {t('casino.playMode.oneshot')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={playMode === 'live' ? 'primary' : 'secondary'}
                  data-testid="casino-play-mode-live"
                  disabled={pipeline.busy || autoQueue.isActive}
                  onClick={() => setPlayMode('live')}
                >
                  {t('casino.playMode.live')}
                </Button>
              </div>
            ) : null}

            <SpendCurrencySelector
              value={currency}
              onChange={setCurrency}
              disabled={lockStake || pipeline.busy || Boolean(progressiveSession)}
              testId="casino-stake-currency"
              currencyTestIdPrefix="casino-stake-currency"
              showHelpTip
            />

            <div className="flex flex-col gap-1">
              <label
                className="text-foreground-muted text-xs font-medium"
                htmlFor="casino-stake-input"
              >
                {t('casino.stake')}
              </label>
              <input
                id="casino-stake-input"
                type="text"
                inputMode="decimal"
                className="border-line bg-surface-raised text-foreground min-h-12 rounded-md border px-3 tabular-nums"
                value={stake}
                disabled={lockStake || pipeline.busy}
                data-testid={CASINO_E2E_TESTIDS.stakeInput}
                onChange={(e) => {
                  setStake(e.target.value);
                  setAutoConfig((prev) => ({ ...prev, baseStake: e.target.value }));
                }}
              />
              {!stakeHint.disabled ? (
                <span
                  data-testid="casino-stake-fiat-hint"
                  data-casino-fiat-hint-role="stake"
                  data-casino-fiat-session-locked={sessionLocked ? 'true' : 'false'}
                  data-fiat-hint-todo={P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO}
                >
                  <FiatHintSecondaryLine fiatHint={stakeHint} hintLayout="secondary" />
                </span>
              ) : null}
            </div>

            <GameSelectionFields
              config={config}
              selection={selection}
              onChange={setSelection}
              disabled={lockStake || pipeline.busy}
            />

            <BetModeTabs
              mode={betMode}
              onChange={setBetMode}
              disabled={lockStake || pipeline.busy || liveMode}
            />

            {liveMode ? (
              <div className="flex flex-col gap-2">
                {gameCode === 'crash' && liveCrashCurrent.data?.round ? (
                  <p
                    className="text-foreground-muted m-0 text-xs tabular-nums"
                    data-testid="casino-live-crash-status"
                  >
                    {t('casino.live.roundStatus')}: {liveCrashCurrent.data.round.status}
                    {liveCrashCurrent.data.round.current_multiplier
                      ? ` · ${liveCrashCurrent.data.round.current_multiplier}×`
                      : ''}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="bet"
                  disabled={
                    progressiveStart.isPending ||
                    liveCrashPlace.isPending ||
                    Boolean(progressiveSession) ||
                    (gameCode === 'crash' && Boolean(liveCrashBetId))
                  }
                  data-testid="casino-live-place-bet"
                  onClick={() => void handleLiveStart()}
                >
                  {gameCode === 'crash' ? t('casino.live.placeBet') : t('casino.progressive.start')}
                </Button>
              </div>
            ) : betMode === 'manual' ? (
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pipeline.busy}
                  data-testid={CASINO_E2E_TESTIDS.prepareHash}
                  onClick={() => {
                    unlockSession();
                    void pipeline.prepareRound();
                  }}
                >
                  {t('casino.prepareHash')}
                </Button>
                <Button
                  type="button"
                  variant="bet"
                  disabled={pipeline.busy || !pipeline.commitment}
                  data-testid={CASINO_E2E_TESTIDS.placeBet}
                  onClick={() => void handleManualBet()}
                >
                  {t('casino.placeBet')}
                </Button>
              </div>
            ) : (
              <AutoBetPanel
                currency={currency}
                config={autoConfig}
                onConfigChange={setAutoConfig}
                status={autoQueue.status}
                remaining={autoQueue.remaining}
                cumulativeProfit={autoQueue.cumulativeProfit}
                nextStake={autoQueue.nextStake}
                canStart={autoQueue.canStart(autoConfig)}
                onStart={handleAutoStart}
                onStop={autoQueue.requestStop}
                disabled={pipeline.busy}
              />
            )}

            {pipeline.errorKey || liveErrorKey ? (
              <p
                className="text-danger m-0 text-sm"
                data-testid={CASINO_E2E_TESTIDS.error}
                role="alert"
              >
                {t((pipeline.errorKey ?? liveErrorKey)!)}
              </p>
            ) : null}

            {recentBets.length > 0 ? (
              <ul
                className="m-0 flex list-none flex-col gap-1 p-0"
                data-testid="casino-shell-recent"
              >
                {recentBets.slice(0, 5).map((row) => (
                  <li key={row.id} className="text-foreground-muted flex justify-between text-xs">
                    <span>{row.status}</span>
                    <CasinoMoneyWithFiatHint
                      amount={row.payout ?? '0'}
                      currency={row.currency}
                      showCurrency
                      role="win"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </aside>
        </div>
      </MoneyDisplayWithFiatHintSlot>
    </section>
  );
}
