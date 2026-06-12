import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Route as rootRoute } from './__root';
import { useAuth } from '../contexts/auth-context';
import { useWallet } from '../hooks/use-wallet';
import { isPositiveDecimalInput, normalizeDecimalInput } from '../lib/money-input';
import { useT } from '../lib/i18n';
import {
  Button,
  BetPanel,
  Badge,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FairnessVerifier,
  GameStakeInput,
  MultiplierDisplay,
  ProvablyFairBadge,
  SegmentedControl,
  Skeleton,
  StatusTimeline,
  Toast,
  formatMoney,
} from '@phonara/ui';
import type { GameCode } from '@phonara/game-engine';
import { GAME_BY_CODE, GAME_CONFIGS } from '../features/casino/game-config';
import { GameFieldControl } from '../features/casino/game-field-control';
import { useCasinoRoundPipeline } from '../features/casino/use-casino-round';
import { loadRecentBets } from '../features/casino/recent-bets';
import { cellsFromText, randomHex } from '../features/casino/helpers';
import type { Currency, RecentBet } from '../features/casino/types';

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

export const casinoFairnessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/fairness',
  component: FairnessDocsPage,
});

function CasinoPage({ initialGame }: { initialGame: GameCode }) {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const [gameCode, setGameCode] = useState<GameCode>(initialGame);
  const [currency, setCurrency] = useState<Currency>('PHON');
  const [stake, setStake] = useState(GAME_BY_CODE[initialGame].defaultStake);
  const [selection, setSelection] = useState<Record<string, unknown>>(GAME_BY_CODE[initialGame].defaultSelection);
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
    void loadRecentBets().then(setRecentBets);
  }, []);

  const timeline = useMemo(
    () => [
      {
        id: 'commit',
        label: t('casino.timeline.commit'),
        description: commitment?.server_seed_hash ?? t('casino.timeline.waiting'),
        state: commitment ? 'done' as const : busy ? 'active' as const : 'pending' as const,
      },
      {
        id: 'settle',
        label: t('casino.timeline.settle'),
        description: bet ? t(bet.status === 'won' ? 'casino.result.won' : 'casino.result.lost') : t('casino.timeline.waiting'),
        state: bet ? 'done' as const : busy && commitment ? 'active' as const : 'pending' as const,
      },
      {
        id: 'reveal',
        label: t('casino.timeline.reveal'),
        description: verificationEvidence
          ? t(verificationEvidence.verification.resultMatch ? 'casino.verify.match' : 'casino.verify.mismatch')
          : t('casino.timeline.waiting'),
        state: verificationEvidence
          ? (verificationEvidence.verification.resultMatch ? 'done' as const : 'error' as const)
          : 'pending' as const,
      },
    ],
    [bet, busy, commitment, t, verificationEvidence],
  );

  function selectGame(next: GameCode) {
    void navigate({ to: next === 'dice' ? '/casino/dice' : `/casino/${next}` });
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
    return <div className="shell"><Skeleton className="h-40" /></div>;
  }

  return (
    <div className="shell">
      <div className="dashboard">
        <header className="dash-header">
          <div className="dash-logo">
            <Link to="/dashboard" className="logo-name" style={{ textDecoration: 'none' }}>PHONARA</Link>
          </div>
          <nav className="dash-nav">
            <Link to="/casino/fairness" className="nav-link">{t('casino.fairness.link')}</Link>
            <Link to="/dashboard" className="nav-link">{t('nav.dashboard')}</Link>
          </nav>
        </header>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-fg">{t('casino.title')}</h1>
              <ProvablyFairBadge>{t('casino.provablyFair')}</ProvablyFairBadge>
            </div>
            <p className="max-w-3xl text-sm text-muted">{t('casino.subtitle')}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <BetPanel
              title={t(config.labelKey)}
              description={t(config.descriptionKey)}
              actions={<Badge tone="primary">{t('casino.instantSettle')}</Badge>}
            >
              <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-6">
                {GAME_CONFIGS.map((game) => (
                  <Link
                    key={game.code}
                    to={game.code === 'dice' ? '/casino/dice' : `/casino/${game.code}`}
                    className={`rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition-colors ${
                      game.code === gameCode
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border bg-surface-2/70 text-muted hover:text-fg'
                    }`}
                    onClick={() => selectGame(game.code)}
                  >
                    {t(game.labelKey)}
                  </Link>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <GameStakeInput
                  data-testid="casino-stake-input"
                  label={t('casino.stake')}
                  value={stake}
                  onChange={(event) => setStake(normalizeDecimalInput(event.target.value))}
                  currency={currency}
                  hint={
                    walletLoading
                      ? t('common.loading')
                      : t('casino.available', { amount: formatMoney(available ?? '0', currency), currency })
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

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {config.fields.map((field) => (
                  <GameFieldControl
                    key={field.key}
                    field={field}
                    selection={selection}
                    onChange={updateSelection}
                  />
                ))}
              </div>

              <label className="mt-4 flex flex-col gap-2">
                <span className="text-sm font-medium text-fg">{t('casino.field.clientSeed')}</span>
                <input
                  className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-fg tabular-nums"
                  data-testid="casino-client-seed-input"
                  value={clientSeed}
                  onChange={(event) => updateClientSeed(event.target.value)}
                />
                <span className="text-xs text-muted">
                  {t(clientSeedIsAuto ? 'casino.field.clientSeedAutoHint' : 'casino.field.clientSeedManualHint')}
                </span>
              </label>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <MultiplierDisplay label={t('casino.hashStatus')} value={commitment ? t('casino.hashReady') : t('casino.hashMissing')} tone={commitment ? 'primary' : 'neutral'} />
                <MultiplierDisplay label={t('casino.lastPayout')} value={bet ? `${formatMoney(bet.payout, currency)} ${currency}` : '-'} tone={bet?.status === 'won' ? 'up' : bet ? 'down' : 'neutral'} />
                <MultiplierDisplay label={t('casino.lossLimit')} value={t('casino.lossLimitValue')} tone="primary" />
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  disabled={busy}
                  data-testid="casino-prepare-hash"
                  onClick={() => void prepareRound()}
                >
                  {commitment ? t('casino.refreshHash') : t('casino.prepareHash')}
                </Button>
                <Button full data-testid="casino-place-bet" disabled={!canSubmit} onClick={openBetConfirm}>
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
            </BetPanel>

            <aside className="flex flex-col gap-4">
              <FairnessVerifier
                data-testid="casino-fairness-verifier"
                title={t('casino.verify.title')}
                seedHashLabel={t('casino.verify.seedHash')}
                seedHash={verificationEvidence?.server_seed_hash ?? commitment?.server_seed_hash ?? t('casino.timeline.waiting')}
                serverSeedLabel={verificationEvidence ? t('casino.verify.serverSeed') : undefined}
                serverSeed={verificationEvidence?.server_seed}
                resultLabel={verificationEvidence ? t('casino.verify.result') : undefined}
                result={verificationEvidence ? JSON.stringify(verificationEvidence.result) : undefined}
                statusLabel={
                  verificationEvidence
                    ? t(
                      verificationEvidence.verification.seedHashMatch && verificationEvidence.verification.resultMatch
                        ? 'casino.verify.match'
                        : 'casino.verify.mismatch',
                    )
                    : t('casino.verify.pending')
                }
                verified={verificationEvidence ? verificationEvidence.verification.seedHashMatch && verificationEvidence.verification.resultMatch === true : null}
              />
              <StatusTimeline items={timeline} />
              {toastKey && <Toast tone="success" title={t(toastKey)} />}
            </aside>
          </div>

          <BetPanel title={t('casino.recent.title')} description={t('casino.recent.description')}>
            {recentBets.length === 0 ? (
              <EmptyState title={t('casino.recent.empty')} description={t('casino.recent.emptyDesc')} />
            ) : (
              <div className="grid gap-2">
                {recentBets.map((row) => (
                  <div key={row.id} className="grid grid-cols-4 items-center gap-2 rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm">
                    <span className="font-semibold text-fg">{t(GAME_BY_CODE[row.game].labelKey)}</span>
                    <Badge tone={row.status === 'won' ? 'up' : 'down'} size="sm">
                      {t(row.status === 'won' ? 'casino.bet.status.won' : 'casino.bet.status.lost')}
                    </Badge>
                    <span className="text-right text-muted">{formatMoney(row.stake, row.currency)} {row.currency}</span>
                    <span className="text-right font-semibold text-fg">{formatMoney(row.payout ?? '0', row.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </BetPanel>
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        testId="casino-bet-confirm"
        title={t('casino.confirm.title')}
        description={t('casino.confirm.description')}
        tone="primary"
        rows={[
          { label: t('casino.confirm.game'), value: t(config.labelKey) },
          { label: t('casino.stake'), value: `${formatMoney(stake, currency)} ${currency}` },
          { label: t('casino.field.clientSeed'), value: clientSeed.slice(0, 16) },
          { label: t('casino.verify.seedHash'), value: commitment?.server_seed_hash.slice(0, 16) ?? '-' },
        ]}
        confirmLabel={t('casino.placeBet')}
        cancelLabel={t('common.cancel')}
        busy={busy}
        onConfirm={() => void submitBet()}
        onCancel={cancelBetConfirm}
      />
    </div>
  );
}

function FairnessDocsPage() {
  const t = useT();
  return (
    <div className="shell">
      <div className="dashboard">
        <header className="dash-header">
          <div className="dash-logo">
            <Link to="/casino" className="logo-name" style={{ textDecoration: 'none' }}>PHONARA</Link>
          </div>
          <nav className="dash-nav">
            <Link to="/casino" className="nav-link">{t('casino.title')}</Link>
            <Link to="/dashboard" className="nav-link">{t('nav.dashboard')}</Link>
          </nav>
        </header>
        <BetPanel title={t('casino.fairness.title')} description={t('casino.fairness.description')}>
          <div className="grid gap-4 md:grid-cols-3">
            <StatusTimeline
              items={[
                { id: 'commit', label: t('casino.fairness.step1'), description: t('casino.fairness.step1.desc'), state: 'done' },
                { id: 'settle', label: t('casino.fairness.step2'), description: t('casino.fairness.step2.desc'), state: 'active' },
                { id: 'verify', label: t('casino.fairness.step3'), description: t('casino.fairness.step3.desc'), state: 'pending' },
              ]}
            />
            <div className="rounded-2xl border border-border bg-surface-2 p-4 md:col-span-2">
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-muted">
{`server_seed -> SHA-256 commitment
HMAC-SHA256(server_seed, client_seed:nonce:cursor) -> floats
GAME_REGISTRY.resultFromFloats(floats, selection) -> stored result`}
              </pre>
            </div>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}
