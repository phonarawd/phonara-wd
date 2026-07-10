import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { GameCode } from '@phonara/game-engine';
import { toDecimal } from '@phonara/money';

import {
  CASINO_STAKE_CURRENCY_EXPOSURE,
  P10_CASINO_REPLAY_AND_INFRA_TODO,
  deriveCasinoWinTier,
  type CasinoWinTier,
} from '@/domain/casino-outcome-replay-contract';
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
import { useCasinoRoundPipeline } from '@/features/casino/use-casino-round';
import { useAuth } from '@/contexts/auth-context';
import { useWallet } from '@/hooks/use-wallet';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { MoneyDisplay } from '@/product/primitives/money-display';
import {
  SpendCurrencySelector,
  type SpendCurrency,
} from '@/product/primitives/spend-currency-selector';
import { AutoBetPanel } from '@/product/surfaces/games/auto-bet-panel';
import { BetModeTabs, type CasinoBetMode } from '@/product/surfaces/games/bet-mode-tabs';
import { CasinoGameStagePlaceholder } from '@/product/surfaces/games/casino-game-stage-placeholder';
import { GameOutcomeLayer } from '@/product/surfaces/games/game-outcome-layer';
import { PfStrip } from '@/product/surfaces/games/pf-strip';
import { WinTierOverlay } from '@/product/surfaces/games/win-tier-overlay';

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
  const config = GAME_BY_CODE[gameCode];

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
    // Reset when navigating between game codes only.
  }, [gameCode]);

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
    if (tier === 'big' || tier === 'mega') setOverlayOpen(true);
  }, []);

  const handleManualBet = useCallback(async () => {
    const result = await pipeline.requestBet();
    if (result !== 'placed') return;
    // bet state updates via pipeline; effect below presents when bet lands
  }, [pipeline]);

  useEffect(() => {
    if (!pipeline.bet) return;
    presentSettle(pipeline.bet.payout, pipeline.bet.status, activeStake);
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
    })();
  }, [autoConfig, autoQueue, pipeline, presentSettle, stake]);

  const lockStake = autoQueue.isActive;

  return (
    <section
      className="mx-auto flex w-full max-w-5xl flex-col gap-4 py-4 md:py-6"
      data-testid="casino-game-shell"
      data-owner-todo={P10_CASINO_REPLAY_AND_INFRA_TODO}
      data-game-code={gameCode}
      data-stake-currency-exposure={CASINO_STAKE_CURRENCY_EXPOSURE}
    >
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
          <MoneyDisplay amount={balanceAmount} currency={currency} showCurrency />
        </div>
      </header>

      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <div className="relative flex flex-col gap-3">
          <CasinoGameStagePlaceholder gameCode={gameCode} />
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
          <PfStrip
            serverSeedHash={pipeline.commitment?.server_seed_hash ?? null}
            clientSeed={clientSeed}
            verificationMatch={verificationMatch}
          />
        </div>

        <aside className="border-line bg-surface flex flex-col gap-4 rounded-md border p-4">
          <SpendCurrencySelector
            value={currency}
            onChange={setCurrency}
            disabled={lockStake || pipeline.busy}
            testId="casino-stake-currency"
            currencyTestIdPrefix="casino-stake-currency"
            showHelpTip
          />

          <div className="flex flex-col gap-1">
            <label className="text-foreground-muted text-xs font-medium" htmlFor="casino-stake-input">
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
          </div>

          <BetModeTabs mode={betMode} onChange={setBetMode} disabled={lockStake || pipeline.busy} />

          {betMode === 'manual' ? (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={pipeline.busy}
                data-testid={CASINO_E2E_TESTIDS.prepareHash}
                onClick={() => void pipeline.prepareRound()}
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

          {pipeline.errorKey ? (
            <p className="text-danger m-0 text-sm" data-testid={CASINO_E2E_TESTIDS.error} role="alert">
              {t(pipeline.errorKey)}
            </p>
          ) : null}

          {recentBets.length > 0 ? (
            <ul className="m-0 flex list-none flex-col gap-1 p-0" data-testid="casino-shell-recent">
              {recentBets.slice(0, 5).map((row) => (
                <li key={row.id} className="text-foreground-muted flex justify-between text-xs">
                  <span>{row.status}</span>
                  <MoneyDisplay amount={row.payout ?? '0'} currency={row.currency} showCurrency />
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
