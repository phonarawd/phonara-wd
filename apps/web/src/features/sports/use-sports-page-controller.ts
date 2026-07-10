import { useCallback, useMemo, useState } from 'react';
import type { MessageKey } from '@phonara/i18n';
import { isGreaterThan, isPositive, money } from '@phonara/money';

import {
  resolveSportsPlaceBetLaunchAllowed,
  type SportsCashoutExposureMode,
} from '@/domain/sports-cashout-combo-display-contract';
import {
  leagueFilterToRpcParam,
  resolveSportsPageModeStatusFilter,
  type SportsLeagueFilter,
  type SportsPageMode,
} from '@/domain/sports-page-display-contract';
import type { SportsLiveFixtureState } from '@/domain/sports-live-surface-display-contract';
import { useAuth } from '@/contexts/auth-context';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { useClientGatePrechecks } from '@/hooks/use-client-gate-prechecks';
import { useSportsRealtime } from '@/hooks/use-sports-realtime';
import { useWallet } from '@/hooks/use-wallet';
import { LAUNCH_GATES } from '@/lib/launch-gates';
import { translateError } from '@/lib/translate-error';
import { usePhonBalanceBreakdown } from '@/features/wallet/use-phon-balance-breakdown';
import { useT } from '@/product/i18n';
import { productToast } from '@/product/primitives/toast-zone';

import {
  useGetFixtureMarkets,
  useListSportsFixtures,
  useLiveFixtureState,
  useLiveFixtureStates,
  useMySportsBets,
  usePlaceSportsBet,
  type SportsFixtureSummary,
  type SportsMarketSummary,
} from './use-sports-betting';
import { useSportsBetSlipState, type SportsSlipSelection } from './use-sports-bet-slip-state';

export type SportsPageControllerView = {
  t: ReturnType<typeof useT>;
  mode: SportsPageMode;
  fixtureId: string | null;
  loading: boolean;
  fixturesLoading: boolean;
  fixturesErrorKey: MessageKey | null;
  fixtures: SportsFixtureSummary[];
  activeFixture: SportsFixtureSummary | null;
  fixtureMarkets: SportsMarketSummary[];
  fixtureMarketsLoading: boolean;
  fixtureMarketsErrorKey: MessageKey | null;
  refreshFixtureMarkets: () => void;
  leagueFilter: SportsLeagueFilter;
  setLeagueFilter: (value: SportsLeagueFilter) => void;
  sportsBlocked: boolean;
  sportsBlockedKey: MessageKey;
  /** `LAUNCH_GATES.sportsBetting` → contract exposure (`built_disabled` until soft-launch flip). */
  placeCtaExposure: SportsCashoutExposureMode;
  phonAvail: string;
  usdtAvail: string;
  phonBonusAvailable: string | null;
  slip: ReturnType<typeof useSportsBetSlipState>;
  selectedOutcomeIds: ReadonlySet<string>;
  toggleSelection: (leg: SportsSlipSelection) => void;
  canPlaceBet: boolean;
  placeBetBusy: boolean;
  confirmOpen: boolean;
  setConfirmOpen: (open: boolean) => void;
  requestPlaceBet: () => void;
  confirmPlaceBet: () => Promise<void>;
  myBetsLoading: boolean;
  myBets: unknown[];
  refreshFixtures: () => void;
  /** Sports#2 — live in-play state map (board) + focused fixture banner. */
  liveStatesByFixtureId: ReadonlyMap<string, SportsLiveFixtureState>;
  activeLiveState: SportsLiveFixtureState | null;
  liveStatesLoading: boolean;
  liveStatesStale: boolean;
  realtimeConnected: boolean;
};

export function useSportsPageController(
  mode: SportsPageMode = 'home',
  fixtureId?: string,
): SportsPageControllerView {
  const t = useT();
  const { session } = useAuth();
  const { sportsBlocked, loading: gatesLoading } = usePlatformGates();
  const { consentBlocked, consentBlockedKey } = useClientGatePrechecks();
  const { wallet, loading: walletLoading } = useWallet();
  const { breakdown, loading: breakdownLoading } = usePhonBalanceBreakdown();
  const [leagueFilter, setLeagueFilter] = useState<SportsLeagueFilter>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const statusFilter = resolveSportsPageModeStatusFilter(mode);
  const leagueParam = leagueFilterToRpcParam(leagueFilter);
  const resolvedFixtureId = mode === 'fixture' ? fixtureId : undefined;
  const liveSurfaceActive = mode === 'live' || mode === 'fixture' || mode === 'home';

  const fixturesQuery = useListSportsFixtures(leagueParam, statusFilter);
  const fixtureMarketsQuery = useGetFixtureMarkets(resolvedFixtureId);
  const myBetsQuery = useMySportsBets(50);
  const placeBetMutation = usePlaceSportsBet();

  const fixtures = fixturesQuery.data ?? [];
  /** On-screen fixtures for odds INSERT debounce scope (PIR pir-p1-sports-odds-debounce). */
  const visibleFixtureIds = useMemo(() => {
    const ids = new Set(fixtures.map((row) => row.fixture_id));
    if (resolvedFixtureId) ids.add(resolvedFixtureId);
    return ids;
  }, [fixtures, resolvedFixtureId]);

  const realtime = useSportsRealtime({
    enabled: liveSurfaceActive,
    visibleFixtureIds,
  });

  const liveBoardIds = mode === 'live' ? fixtures.map((row) => row.fixture_id) : ([] as string[]);
  const liveBoardStates = useLiveFixtureStates(liveBoardIds);
  const focusedLiveStateQuery = useLiveFixtureState(
    mode === 'fixture' && resolvedFixtureId ? resolvedFixtureId : undefined,
  );

  const phonBonusAvailable = breakdown?.phon_bonus_available ?? null;
  const slip = useSportsBetSlipState(phonBonusAvailable);

  const phonAvail = wallet?.phon_available ?? breakdown?.phon_available ?? '0';
  const usdtAvail = wallet?.usdt_available ?? '0';

  const availForCurrency = slip.stakeCurrency === 'PHON' ? phonAvail : usdtAvail;

  const selectedOutcomeIds = useMemo(
    () => new Set(slip.selections.map((row) => row.outcomeId)),
    [slip.selections],
  );

  const stakeReady = useMemo(() => {
    const stakeRaw = slip.stake.replace(/,/g, '').trim();
    if (!stakeRaw) return false;
    try {
      const stakeMoney = money(stakeRaw, slip.stakeCurrency);
      const availMoney = money(availForCurrency, slip.stakeCurrency);
      return isPositive(stakeMoney) && !isGreaterThan(stakeMoney, availMoney);
    } catch {
      return false;
    }
  }, [availForCurrency, slip.stake, slip.stakeCurrency]);

  const { placeCtaExposure, launchPlaceAllowed } = resolveSportsPlaceBetLaunchAllowed({
    sportsBettingGate: LAUNCH_GATES.sportsBetting,
    sportsKillSwitchBlocked: sportsBlocked,
  });

  const entryBlocked = sportsBlocked || consentBlocked || placeCtaExposure === 'built_disabled';
  const entryBlockedKey: MessageKey = consentBlocked
    ? consentBlockedKey
    : 'sports.gate.feature_off';

  const canPlaceBet =
    launchPlaceAllowed &&
    !consentBlocked &&
    Boolean(session?.user) &&
    slip.selections.length > 0 &&
    stakeReady &&
    !placeBetMutation.isPending;

  const requestPlaceBet = useCallback(() => {
    if (!canPlaceBet) return;
    setConfirmOpen(true);
  }, [canPlaceBet]);

  const confirmPlaceBet = useCallback(async () => {
    if (!canPlaceBet) return;
    const stakeRaw = slip.stake.replace(/,/g, '').trim();
    try {
      await placeBetMutation.mutateAsync({
        legs: slip.selections.map((row) => ({
          outcome_id: row.outcomeId,
          odds_at_bet: row.oddsAtBet,
        })),
        stake: stakeRaw,
        currency: slip.stakeCurrency,
        idempotencyKey: crypto.randomUUID(),
        betKind: slip.selections.length > 1 ? 'combo' : 'single',
      });
      setConfirmOpen(false);
      slip.clearSlip();
      productToast.show({
        zone: 'strict',
        key: 'sports.slip.place_success',
      });
    } catch (error) {
      productToast.show({
        zone: 'strict',
        key: translateError(error),
      });
    }
  }, [canPlaceBet, placeBetMutation, slip]);

  const fixturesErrorKey = fixturesQuery.error ? translateError(fixturesQuery.error) : null;
  const fixtureMarketsErrorKey = fixtureMarketsQuery.error
    ? translateError(fixtureMarketsQuery.error)
    : null;

  const activeFixture = useMemo(() => {
    if (!resolvedFixtureId) return null;
    return fixtures.find((row) => row.fixture_id === resolvedFixtureId) ?? null;
  }, [fixtures, resolvedFixtureId]);

  const featuredLiveBoardState =
    mode === 'live' && fixtures[0]
      ? (liveBoardStates.byFixtureId.get(fixtures[0].fixture_id) ?? null)
      : null;

  let activeLiveState: SportsLiveFixtureState | null = focusedLiveStateQuery.data ?? null;
  if (!activeLiveState && resolvedFixtureId) {
    activeLiveState = liveBoardStates.byFixtureId.get(resolvedFixtureId) ?? null;
  }
  if (!activeLiveState) {
    activeLiveState = featuredLiveBoardState;
  }

  const loading = gatesLoading || walletLoading || breakdownLoading;

  return {
    t,
    mode,
    fixtureId: resolvedFixtureId ?? null,
    loading,
    fixturesLoading: fixturesQuery.isLoading,
    fixturesErrorKey,
    fixtures,
    activeFixture,
    fixtureMarkets: fixtureMarketsQuery.data ?? [],
    fixtureMarketsLoading: fixtureMarketsQuery.isLoading,
    fixtureMarketsErrorKey,
    refreshFixtureMarkets: () => {
      void fixtureMarketsQuery.refetch();
    },
    leagueFilter,
    setLeagueFilter,
    sportsBlocked: entryBlocked,
    sportsBlockedKey: entryBlockedKey,
    placeCtaExposure,
    phonAvail,
    usdtAvail,
    phonBonusAvailable,
    slip,
    selectedOutcomeIds,
    toggleSelection: slip.toggleSelection,
    canPlaceBet,
    placeBetBusy: placeBetMutation.isPending,
    confirmOpen,
    setConfirmOpen,
    requestPlaceBet,
    confirmPlaceBet,
    myBetsLoading: myBetsQuery.isLoading,
    myBets: myBetsQuery.data ?? [],
    refreshFixtures: () => {
      void fixturesQuery.refetch();
    },
    liveStatesByFixtureId: liveBoardStates.byFixtureId,
    activeLiveState,
    liveStatesLoading: liveBoardStates.loading || focusedLiveStateQuery.isLoading,
    liveStatesStale: liveBoardStates.isFetching || focusedLiveStateQuery.isFetching,
    realtimeConnected: realtime.connected,
  };
}
