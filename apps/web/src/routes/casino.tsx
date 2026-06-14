import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Route as rootRoute } from './__root';
import { useAuth } from '../contexts/auth-context';
import { useWallet } from '../hooks/use-wallet';
import { useConfirmSnapshot } from '../hooks/use-confirm-snapshot';
import { isPositiveDecimalInput, normalizeDecimalInput } from '../lib/money-input';
import { useT } from '../lib/i18n';
import {
  Button,
  BetPanel,
  ConfirmDialog,
  DiceTrack,
  ErrorState,
  FairnessVerifier,
  GameStakeInput,
  HiLoCards,
  LimboMeter,
  MinesGrid,
  MultiplierDisplay,
  PlinkoBoard,
  RocketActivityFeed,
  RocketBetSurface,
  RocketCrashCanvas,
  RocketGameTopBar,
  RocketHistoryStrip,
  RocketStarfield,
  SegmentedControl,
  Skeleton,
  StatusTimeline,
  Toast,
  formatMoney,
  type RocketActivityItem,
  type RocketCrashCanvasState,
  type RocketHistoryItem,
} from '@phonara/ui';
import type { GameCode } from '@phonara/game-engine';
import { CasinoLovableSurface } from '../presentation-import/casino/casino-lovable-surface';
import { USE_LOVABLE_CASINO_SURFACE } from '../presentation-import/casino/casino-skin';
import type { MessageKey } from '@phonara/i18n';
import { GAME_BY_CODE, GAME_CONFIGS, casinoGamePath } from '../features/casino/game-config';
import { GameFieldControl } from '../features/casino/game-field-control';
import { useCasinoRoundPipeline } from '../features/casino/use-casino-round';
import { loadRecentBets } from '../features/casino/recent-bets';
import { cellsFromText, randomHex } from '../features/casino/helpers';
import type { Currency, RecentBet } from '../features/casino/types';
import { AppShell } from '../components/app-shell';

export const casinoIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino',
  component: () => <CasinoPage initialGame="dice" />,
});

export const casinoCrashRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/crash',
  component: () => <CasinoPage initialGame="crash" />,
});

export const casinoLimboRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/limbo',
  component: () => <CasinoPage initialGame="limbo" />,
});

export const casinoDiceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/dice',
  component: () => <CasinoPage initialGame="dice" />,
});

export const casinoMinesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/mines',
  component: () => <CasinoPage initialGame="mines" />,
});

export const casinoHiloRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/hilo',
  component: () => <CasinoPage initialGame="hilo" />,
});

export const casinoPlinkoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/plinko',
  component: () => <CasinoPage initialGame="plinko" />,
});

export const casinoMintReelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/mint-reels',
  component: () => <CasinoPage initialGame="mint_reels" />,
});

export const casinoGoldRushRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/gold-rush',
  component: () => <CasinoPage initialGame="gold_rush" />,
});

export const casinoRouletteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/roulette',
  component: () => <CasinoPage initialGame="roulette" />,
});

export const casinoBlackjackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/blackjack',
  component: () => <CasinoPage initialGame="blackjack" />,
});

export const casinoFairnessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/fairness',
  component: FairnessDocsPage,
});

function CasinoPage({ initialGame }: { initialGame: GameCode }) {
  if (USE_LOVABLE_CASINO_SURFACE) {
    return <CasinoLovableSurface initialGame={initialGame} />;
  }
  return <LegacyCasinoPage initialGame={initialGame} />;
}

function LegacyCasinoPage({ initialGame }: { initialGame: GameCode }) {
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
  const gameResult = bet ? JSON.stringify(bet.result) : undefined;
  const settled = Boolean(bet);
  const autoCashout = selection['autoCashout'] ?? config.defaultSelection['autoCashout'] ?? '';
  const target = selection['target'] ?? config.defaultSelection['target'] ?? '';
  const direction = selection['direction'];
  const revealedCells = selection['revealedCells'];
  const guesses = selection['guesses'];
  const rows = selection['rows'] ?? config.defaultSelection['rows'] ?? '';
  const risk = selection['risk'];

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

  const timeline = useMemo(
    () => [
      {
        id: 'commit',
        label: t('casino.timeline.commit'),
        description: commitment?.server_seed_hash ?? t('casino.timeline.waiting'),
        state: commitment ? ('done' as const) : busy ? ('active' as const) : ('pending' as const),
      },
      {
        id: 'settle',
        label: t('casino.timeline.settle'),
        description: bet
          ? t(bet.status === 'won' ? 'casino.result.won' : 'casino.result.lost')
          : t('casino.timeline.waiting'),
        state: bet
          ? ('done' as const)
          : busy && commitment
            ? ('active' as const)
            : ('pending' as const),
      },
      {
        id: 'reveal',
        label: t('casino.timeline.reveal'),
        description: verificationEvidence
          ? t(
              verificationEvidence.verification.resultMatch
                ? 'casino.verify.match'
                : 'casino.verify.mismatch',
            )
          : t('casino.timeline.waiting'),
        state: verificationEvidence
          ? verificationEvidence.verification.resultMatch
            ? ('done' as const)
            : ('error' as const)
          : ('pending' as const),
      },
    ],
    [bet, busy, commitment, t, verificationEvidence],
  );

  const rocketState: RocketCrashCanvasState = busy && commitment
    ? 'flying'
    : bet?.status === 'lost'
      ? 'crashed'
      : bet
        ? 'settled'
        : commitment
          ? 'armed'
          : 'idle';
  const primaryResult = getPrimaryResultLabel(bet?.result);
  const rocketActivityItems = useMemo<RocketActivityItem[]>(
    () =>
      recentBets.map((row) => ({
        id: row.id,
        title: t(GAME_BY_CODE[row.game].labelKey),
        subtitle: `${formatMoney(row.stake, row.currency)} ${row.currency}`,
        value: t(row.status === 'won' ? 'casino.bet.status.won' : 'casino.bet.status.lost'),
        valueDetail: row.payout ? `${formatMoney(row.payout, row.currency)} ${row.currency}` : undefined,
        status: row.status === 'won' ? 'won' : row.status === 'lost' ? 'lost' : 'neutral',
        highlighted: row.id === bet?.bet_id,
      })),
    [bet?.bet_id, recentBets, t],
  );
  const rocketHistoryItems = useMemo<RocketHistoryItem[]>(
    () =>
      recentBets.map((row) => ({
        id: row.id,
        label: row.payout ? formatMoney(row.payout, row.currency) : t(row.status === 'won' ? 'casino.result.won' : 'casino.result.lost'),
        meta: `${t(GAME_BY_CODE[row.game].labelKey)} · ${row.currency}`,
        tone: row.status === 'won' ? 'good' : row.status === 'lost' ? 'low' : 'neutral',
      })),
    [recentBets, t],
  );

  function selectGame(next: GameCode) {
    void navigate({ to: casinoGamePath(next) });
  }

  function updateSelection(key: string, value: string) {
    setSelection((current) => {
      if (key === 'guesses.0') return { ...current, guesses: [value] };
      if (key === 'revealedCells') return { ...current, revealedCells: cellsFromText(value, 24) };
      if (key === 'rows' || key === 'mineCount') return { ...current, [key]: Number(value) };
      return { ...current, [key]: value };
    });
    resetRoundState();
  }

  function updateClientSeed(value: string) {
    setClientSeed(value);
    setClientSeedIsAuto(false);
    resetRoundState();
  }

  if (authLoading) {
    return (
      <AppShell active="games">
        <div className="surface-games app-page" aria-busy="true">
          <Skeleton className="h-40" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="games">
      <div className="surface-games relative min-h-[calc(100dvh-4rem)] overflow-hidden">
        <RocketStarfield />
        <RocketGameTopBar
          title={t('casino.rocket.title')}
          subtitle={t('casino.rocket.subtitle')}
          balanceLabel={t('casino.rocket.balance')}
          balance={formatMoney(available ?? '0', currency)}
          currency={currency}
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={() => void prepareRound()} disabled={busy}>
                {commitment ? t('casino.refreshHash') : t('casino.prepareHash')}
              </Button>
              <Link to="/casino/fairness" className="text-sm font-semibold text-rocket-cyan hover:underline">
                {t('casino.fairness.link')}
              </Link>
            </>
          }
        />

        <main className="relative z-10 px-3 py-3 md:px-5 md:py-4">
          <div className="grid gap-3 md:gap-4 lg:grid-cols-[320px_minmax(0,1fr)_340px]">
            <aside className="flex flex-col gap-3 lg:order-0">
              <RocketBetSurface
                eyebrow={t('casino.rocket.betSlot')}
              title={t(config.labelKey)}
                badge={t('casino.instantSettle')}
                accent="magenta"
            >
              <div className="casino-game-switcher" aria-label={t('casino.title')}>
                {GAME_CONFIGS.map((game) => (
                  <Link
                    key={game.code}
                    to={casinoGamePath(game.code)}
                    className={`casino-game-switcher-item ${
                      game.code === gameCode ? 'is-active' : ''
                    }`}
                    onClick={() => selectGame(game.code)}
                  >
                    {t(game.labelKey)}
                  </Link>
                ))}
              </div>

              <div className="grid gap-3">
                <GameStakeInput
                  data-testid="casino-stake-input"
                  label={t('casino.stake')}
                  value={stake}
                  onChange={(event) => setStake(normalizeDecimalInput(event.target.value))}
                  currency={currency}
                  hint={
                    walletLoading
                      ? t('common.loading')
                      : t('casino.available', {
                          amount: formatMoney(available ?? '0', currency),
                          currency,
                        })
                  }
                />

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-fg">{t('casino.currency')}</span>
                  <SegmentedControl<Currency>
                    value={currency}
                    onChange={setCurrency}
                    options={[
                      { value: 'PHON', label: 'PHON' },
                      { value: 'USDT', label: 'USDT' },
                    ]}
                  />
                </label>
              </div>

              <div className="grid gap-3">
                {config.fields.map((field) => (
                  <GameFieldControl
                    key={field.key}
                    field={field}
                    selection={selection}
                    onChange={updateSelection}
                  />
                ))}
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-fg">{t('casino.field.clientSeed')}</span>
                <input
                  className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-fg tabular-nums"
                  data-testid="casino-client-seed-input"
                  aria-label={t('casino.field.clientSeed')}
                  value={clientSeed}
                  onChange={(event) => updateClientSeed(event.target.value)}
                />
                <span className="text-xs text-muted">
                  {t(
                    clientSeedIsAuto
                      ? 'casino.field.clientSeedAutoHint'
                      : 'casino.field.clientSeedManualHint',
                  )}
                </span>
              </label>

              <div className="grid gap-3">
                <MultiplierDisplay
                  label={t('casino.hashStatus')}
                  value={commitment ? t('casino.hashReady') : t('casino.hashMissing')}
                  tone={commitment ? 'primary' : 'neutral'}
                />
                <MultiplierDisplay
                  label={t('casino.lastPayout')}
                  value={
                    bet
                      ? `${formatMoney(bet.payout, currency)} ${currency}`
                      : t('casino.timeline.waiting')
                  }
                  tone={bet?.status === 'won' ? 'up' : bet ? 'down' : 'neutral'}
                />
                <MultiplierDisplay
                  label={t('casino.lossLimit')}
                  value={t('casino.lossLimitValue')}
                  tone="primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  disabled={busy}
                  data-testid="casino-prepare-hash"
                  onClick={() => void prepareRound()}
                >
                  {commitment ? t('casino.refreshHash') : t('casino.prepareHash')}
                </Button>
                <Button
                  full
                  data-testid="casino-place-bet"
                  disabled={!canSubmit}
                  onClick={openBetConfirm}
                >
                  {busy ? t('common.processing') : t('casino.placeBet')}
                </Button>
              </div>

              {errorKey && (
                <ErrorState
                  className="mt-4"
                  data-testid="casino-error"
                  title={t('casino.error.title')}
                  description={t(errorKey)}
                />
              )}
              </RocketBetSurface>
            </aside>

            <section className="flex min-w-0 flex-col gap-3">
              {gameCode === 'crash' ? (
                <RocketCrashCanvas
                  data-testid="casino-rocket-canvas"
                    title={t('casino.game.crash')}
                  multiplierLabel={primaryResult ?? (commitment ? `${String(autoCashout)}x` : '1.00x')}
                    targetLabel={t('casino.field.autoCashout')}
                  target={`${String(autoCashout)}x`}
                  statusLabel={t(rocketStateToMessageKey(rocketState))}
                  seedHashLabel={t('casino.verify.seedHash')}
                  seedHash={commitment?.server_seed_hash.slice(0, 16) ?? t('casino.timeline.waiting')}
                    resultLabel={gameResult ? t('casino.verify.result') : undefined}
                    result={gameResult}
                  state={rocketState}
                  />
              ) : (
                <div className="rocket-glass-panel rounded-2xl p-4">
                {gameCode === 'limbo' && (
                  <LimboMeter
                    title={t('casino.game.limbo')}
                    targetLabel={t('casino.field.targetMultiplier')}
                    target={String(target)}
                    resultLabel={gameResult ? t('casino.verify.result') : undefined}
                    result={gameResult}
                    settled={settled}
                  />
                )}
                {gameCode === 'dice' && (
                  <DiceTrack
                    title={t('casino.game.dice')}
                    targetLabel={t('casino.field.target')}
                    target={String(target)}
                    directionLabel={t('casino.field.direction')}
                    direction={
                      direction === 'under' ? t('casino.option.under') : t('casino.option.over')
                    }
                    resultLabel={gameResult ? t('casino.verify.result') : undefined}
                    result={gameResult}
                    settled={settled}
                  />
                )}
                {gameCode === 'mines' && (
                  <MinesGrid
                    title={t('casino.game.mines')}
                    selectedLabel={t('casino.field.revealedCells')}
                    selectedCells={Array.isArray(revealedCells) ? revealedCells : []}
                    resultLabel={gameResult ? t('casino.verify.result') : undefined}
                    result={gameResult}
                    settled={settled}
                  />
                )}
                {gameCode === 'hilo' && (
                  <HiLoCards
                    title={t('casino.game.hilo')}
                    guessLabel={t('casino.field.firstGuess')}
                    guess={
                      Array.isArray(guesses) && guesses[0] === 'lower'
                        ? t('casino.option.lower')
                        : Array.isArray(guesses) && guesses[0] === 'skip'
                          ? t('casino.option.skip')
                          : t('casino.option.higher')
                    }
                    resultLabel={gameResult ? t('casino.verify.result') : undefined}
                    result={gameResult}
                    settled={settled}
                  />
                )}
                {gameCode === 'plinko' && (
                  <PlinkoBoard
                    title={t('casino.game.plinko')}
                    rowsLabel={t('casino.field.rows')}
                    rows={String(rows)}
                    rowCount={typeof rows === 'number' ? rows : undefined}
                    riskLabel={t('casino.field.risk')}
                    risk={
                      risk === 'high'
                        ? t('casino.option.high')
                        : risk === 'low'
                          ? t('casino.option.low')
                          : t('casino.option.medium')
                    }
                    resultLabel={gameResult ? t('casino.verify.result') : undefined}
                    result={gameResult}
                    settled={settled}
                  />
                )}
              </div>
              )}

              <RocketHistoryStrip
                title={t('casino.rocket.recent')}
                emptyLabel={t('casino.recent.empty')}
                items={rocketHistoryItems}
              />

            </section>

            <aside className="flex flex-col gap-3">
              <RocketActivityFeed
                title={t('casino.rocket.activity')}
                liveLabel={t('casino.rocket.live')}
                emptyLabel={t('casino.rocket.waiting')}
                items={rocketActivityItems}
                className="min-h-[360px]"
              />
              <FairnessVerifier
                data-testid="casino-fairness-verifier"
                title={t('casino.verify.title')}
                description={t('casino.subtitle')}
                seedHashLabel={t('casino.verify.seedHash')}
                seedHash={
                  verificationEvidence?.server_seed_hash ??
                  commitment?.server_seed_hash ??
                  t('casino.timeline.waiting')
                }
                serverSeedLabel={t('casino.verify.serverSeed')}
                serverSeed={verificationEvidence?.server_seed}
                resultLabel={t('casino.verify.result')}
                result={
                  verificationEvidence ? JSON.stringify(verificationEvidence.result) : undefined
                }
                statusLabel={
                  verificationEvidence
                    ? t(
                        verificationEvidence.verification.seedHashMatch &&
                          verificationEvidence.verification.resultMatch
                          ? 'casino.verify.match'
                          : 'casino.verify.mismatch',
                      )
                    : t('casino.verify.pending')
                }
                verified={
                  verificationEvidence
                    ? verificationEvidence.verification.seedHashMatch &&
                      verificationEvidence.verification.resultMatch === true
                    : null
                }
              />
              <StatusTimeline items={timeline} />
              <div role="status" aria-live="polite">
                {toastKey && <Toast tone="success" title={t(toastKey)} />}
              </div>
            </aside>
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        testId="casino-bet-confirm"
        title={t('casino.confirm.title')}
        description={t('casino.confirm.description')}
        notice={confirmNotice}
        tone="primary"
        rows={[
          { label: t('casino.confirm.game'), value: t(config.labelKey) },
          {
            label: t('casino.stake'),
            value: `${formatMoney(stake, currency)} ${currency}`,
            emphasis: 'hero',
          },
          { label: t('casino.field.clientSeed'), value: clientSeed.slice(0, 16), wrap: true },
          {
            label: t('casino.verify.seedHash'),
            value: commitment?.server_seed_hash.slice(0, 16) ?? t('casino.timeline.waiting'),
            wrap: true,
          },
        ]}
        confirmLabel={t('casino.placeBet')}
        cancelLabel={t('common.cancel')}
        processingLabel={t('common.processing')}
        busy={busy}
        confirmDisabled={!canConfirm || !commitment}
        onConfirm={() => void submitBet()}
        onCancel={cancelBetConfirm}
      />
    </AppShell>
  );
}

function rocketStateToMessageKey(state: RocketCrashCanvasState): MessageKey {
  switch (state) {
    case 'armed':
      return 'casino.rocket.state.armed';
    case 'flying':
      return 'casino.rocket.state.flying';
    case 'settled':
      return 'casino.rocket.state.settled';
    case 'crashed':
      return 'casino.rocket.state.crashed';
    case 'idle':
    default:
      return 'casino.rocket.state.idle';
  }
}

function getPrimaryResultLabel(result: Record<string, unknown> | undefined): string | null {
  if (!result) return null;
  const fields = ['crashMultiplier', 'cashoutMultiplier', 'resultMultiplier', 'roll'] as const;
  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string' || typeof value === 'number') {
      const suffix = field === 'roll' ? '' : 'x';
      return `${value}${suffix}`;
    }
  }
  return null;
}

function FairnessDocsPage() {
  const t = useT();
  return (
    <AppShell active="games">
      <div className="surface-games app-page">
        <BetPanel title={t('casino.fairness.title')} description={t('casino.fairness.description')}>
          <div className="grid gap-4 md:grid-cols-3">
            <StatusTimeline
              items={[
                {
                  id: 'commit',
                  label: t('casino.fairness.step1'),
                  description: t('casino.fairness.step1.desc'),
                  state: 'done',
                },
                {
                  id: 'settle',
                  label: t('casino.fairness.step2'),
                  description: t('casino.fairness.step2.desc'),
                  state: 'active',
                },
                {
                  id: 'verify',
                  label: t('casino.fairness.step3'),
                  description: t('casino.fairness.step3.desc'),
                  state: 'pending',
                },
              ]}
            />
            <div className="rounded-2xl border border-border bg-surface-2 p-4 md:col-span-2">
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-muted">
                {t('casino.fairness.formula')}
              </pre>
            </div>
          </div>
        </BetPanel>
      </div>
    </AppShell>
  );
}
