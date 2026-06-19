import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { formatMoney } from '@/hooks/use-money';
import { toDecimal } from '@phonara/money';
import { useAuth } from '../../contexts/auth-context';
import { useWallet } from '../../hooks/use-wallet';
import { useDailyClaim, useMissions, useRoulette } from '../../hooks/use-retention';
import { useT } from '../../lib/i18n';
import { ensureOnboardingConsents } from '../../lib/onboarding-consent';
import type { Tier } from '../../components/fomo/TierBadge';

export type DashboardPageViewProps = {
  balanceDisplay: string;
  fiatDisplay: string;
  pointsDisplay: string;
  tier: Tier;
  missionProgressPct: number;
  missionProgressLabel: string;
  streakDaysDisplay: string;
};

export function useDashboardPageController() {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { wallet, loading: walletLoading, error } = useWallet();
  const { claimDaily, loading: dailyLoading, streak } = useDailyClaim();
  const { spin, loading: rouletteLoading, spinning } = useRoulette();
  const { missions, loading: missionsLoading } = useMissions();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  useEffect(() => {
    if (!session?.user.id) return;
    void ensureOnboardingConsents().catch(() => undefined);
  }, [session?.user.id]);

  useEffect(() => {
    if (!walletLoading && wallet) {
      const isNew =
        wallet.phon_available === '0.000000' &&
        wallet.usdt_available === '0.000000' &&
        wallet.krw_available === '0';
      if (isNew) setShowWelcome(true);
    }
  }, [wallet, walletLoading]);

  const viewProps = useMemo((): DashboardPageViewProps => {
    const phon = wallet?.phon_available ?? '0';
    const krw = wallet?.krw_available ?? '0';
    const phonFormatted = formatMoney(phon, 'PHON');
    const completedMissions = missions.filter((m) => m.completed_at).length;
    const totalMissions = missions.length;
    const missionProgressPct =
      totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 40;
    const missionProgressLabel =
      totalMissions > 0 ? `${completedMissions} / ${totalMissions}` : t('dashboard.mission.progress');
    const streakDays = streak?.current_streak ?? 0;
    const streakDaysDisplay =
      streakDays > 0
        ? t('dashboard.streak.count', { count: streakDays })
        : t('dashboard.streak.days');

    let tier: Tier = 'bronze';
    try {
      const phonBal = toDecimal(phon);
      if (phonBal.greaterThanOrEqualTo('100000')) tier = 'diamond';
      else if (phonBal.greaterThanOrEqualTo('50000')) tier = 'platinum';
      else if (phonBal.greaterThanOrEqualTo('10000')) tier = 'gold';
      else if (phonBal.greaterThanOrEqualTo('1000')) tier = 'silver';
    } catch {
      tier = 'bronze';
    }

    return {
      balanceDisplay: `${phonFormatted}P`,
      fiatDisplay: `₩${formatMoney(krw, 'KRW')}`,
      pointsDisplay: `${phonFormatted}P`,
      tier,
      missionProgressPct,
      missionProgressLabel,
      streakDaysDisplay,
    };
  }, [wallet, missions, streak, t]);

  return {
    t,
    authLoading,
    walletLoading: walletLoading || missionsLoading,
    error,
    showWelcome,
    dismissWelcome: () => setShowWelcome(false),
    claimDaily,
    dailyLoading,
    spin,
    rouletteLoading: rouletteLoading || spinning,
    viewProps,
  };
}
