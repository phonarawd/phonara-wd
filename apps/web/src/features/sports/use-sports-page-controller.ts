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
import { useAuth } from '@/contexts/auth-context';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { useClientGatePrechecks } from '@/hooks/use-client-gate-prechecks';
import { useWallet } from '@/hooks/use-wallet';
import { LAUNCH_GATES } from '@/lib/launch-gates';
import { translateError } from '@/lib/translate-error';
import { usePhonBalanceBreakdown } from '@/features/wallet/use-phon-balance-breakdown';
import { useT } from '@/product/i18n';
import { productToast } from '@/product/primitives/toast-zone';

import {
  useListSportsFixtures,
  useMySportsBets,
  usePlaceSportsBet,
  type SportsFixtureSummary,
} from './use-sports-betting';
import { useSportsBetSlipState, type SportsSlipSelection } from './use-sports-bet-slip-state';

export type SportsPageControllerView = {
  t: ReturnType<typeof useT>;
  mode: SportsPageMode;
  loading: boolean;
  fixturesLoading: boolean;
  fixturesErrorKey: MessageKey | null;
  fixtures: SportsFixtureSummary[];
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
};

export function useSportsPageController(mode: SportsPageMode = 'home'): SportsPageControllerView {
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

  const fixturesQuery = useListSportsFixtures(leagueParam, statusFilter);
  const myBetsQuery = useMySportsBets(50);
  const placeBetMutation = usePlaceSportsBet();

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

  const loading = gatesLoading || walletLoading || breakdownLoading;

  return {
    t,
    mode,
    loading,
    fixturesLoading: fixturesQuery.isLoading,
    fixturesErrorKey,
    fixtures: fixturesQuery.data ?? [],
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
  };
}
