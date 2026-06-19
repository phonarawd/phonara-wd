import { useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { formatMoney } from '@/hooks/use-money';
import {
  useDailyClaim,
  useMissions,
  useReferralDashboard,
  useRoulette,
  ROULETTE_PRIZES,
  type MissionStatus as EngineMissionStatus,
} from '../../hooks/use-retention';
import { useAuth } from '../../contexts/auth-context';
import { useT } from '../../lib/i18n';
import type { DailyCheckInDay } from '../../components/earn/DailyCheckIn';
import type { MissionItem } from '../../components/earn/MissionChecklist';
import { EARN_STATIC_MISSIONS } from '../../presentation-import/pages/earn-missions-page';

export type EarnLayoutViewProps = {
  todayPointsDisplay: string;
  totalPointsDisplay: string;
};

export type EarnHomeViewProps = {
  days: DailyCheckInDay[];
  streakLabel: string;
  todayRewardLabel: string;
  pointsDisplay: string;
  referralCode: string;
  inviteUrl: string;
  referralProgressLabel: string;
  ticketsDisplay: string;
  wheelDisabled: boolean;
  onClaimDaily: () => void;
  onWheelSpin: () => Promise<{ won: boolean; value: number } | null>;
};

const ATTENDANCE_REWARD_LABELS = ['+1,000P', '+1,000P', '+1,000P', '+1,500P', '+2,000P', '+2,500P', '+5,000P'];

const ENGINE_MISSION_TO_UI: Record<string, string> = {
  complete_profile: 'growth-completeProfile',
  first_trade: 'growth-firstGame',
  first_deposit: 'growth-firstDeposit',
  kyc_verified: 'growth-kyc',
  invite_3_friends: 'viral-invite3',
};

function phonToPointsDisplay(phon: string): string {
  return `${formatMoney(phon, 'PHON')}P`;
}

function buildAttendanceDays(streakDay: number, claimedToday: boolean): DailyCheckInDay[] {
  const activeDay = Math.min(Math.max(streakDay, 1), 7);
  return ATTENDANCE_REWARD_LABELS.map((rewardLabel, index) => {
    const dayNum = index + 1;
    const claimed = dayNum < activeDay || (dayNum === activeDay && claimedToday);
    const today = dayNum === activeDay && !claimedToday;
    return {
      label: `Day ${dayNum}`,
      rewardLabel,
      claimed,
      today,
    };
  });
}

function mergeMissionItems(engineMissions: EngineMissionStatus[]): MissionItem[] {
  const completedUiIds = new Set<string>();
  for (const row of engineMissions) {
    if (!row.completed_at) continue;
    const uiId = ENGINE_MISSION_TO_UI[row.mission] ?? row.mission;
    completedUiIds.add(uiId);
  }

  return EARN_STATIC_MISSIONS.map((item) =>
    completedUiIds.has(item.id) ? { ...item, status: 'done' as const } : item,
  );
}

export function useEarnPageController() {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { claimDaily, streak, canClaimToday, loading: dailyLoading, result: dailyResult } =
    useDailyClaim();
  const { spin, canSpinToday, spinning, loading: rouletteLoading } = useRoulette();
  const { missions, loading: missionsLoading } = useMissions();
  const { data: referralData, isLoading: referralLoading } = useReferralDashboard();

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  const layoutProps = useMemo((): EarnLayoutViewProps => {
    const totalPhon = streak?.total_phon_earned ?? '0';
    const todayPhon = dailyResult?.phon_awarded ?? '0';
    return {
      todayPointsDisplay: phonToPointsDisplay(todayPhon),
      totalPointsDisplay: phonToPointsDisplay(totalPhon),
    };
  }, [streak, dailyResult]);

  const homeProps = useMemo((): EarnHomeViewProps => {
    const streakDay = streak?.current_streak ?? 0;
    const claimedToday = !canClaimToday();
    const activeDay = Math.max(streakDay, claimedToday ? streakDay : streakDay + 1);
    const todayIndex = Math.min(Math.max(activeDay, 1), 7) - 1;
    const referralCode = referralData?.code ?? '';
    const origin = typeof window === 'undefined' ? 'https://phonara.app' : window.location.origin;

    return {
      days: buildAttendanceDays(streakDay, claimedToday).map((day, index) => ({
        ...day,
        label: t('earn.attendance.day', { n: index + 1 }),
      })),
      streakLabel:
        streakDay > 0
          ? t('earn.attendance.streakActive', { n: streakDay })
          : t('earn.attendance.streak', { n: 0 }),
      todayRewardLabel: ATTENDANCE_REWARD_LABELS[todayIndex] ?? '+1,500P',
      pointsDisplay: phonToPointsDisplay(streak?.total_phon_earned ?? '0'),
      referralCode: referralCode || '—',
      inviteUrl: referralCode ? `${origin}/r/${referralCode}` : origin,
      referralProgressLabel: t('earn.referral.progress', {
        done: referralData?.approved ?? 0,
        total: 5,
      }),
      ticketsDisplay: canSpinToday() ? '1' : '0',
      wheelDisabled: !canSpinToday() || spinning || rouletteLoading,
      onClaimDaily: () => {
        void (async () => {
          const claimed = await claimDaily();
          if (claimed?.phon_awarded) {
            toast.success(t('earn.attendance.claimedToast', { reward: phonToPointsDisplay(claimed.phon_awarded) }));
          } else if (!claimed) {
            toast.error(t('error.DAILY_CLAIM_FAILED'));
          }
        })();
      },
      onWheelSpin: async () => {
        const spinResult = await spin();
        if (!spinResult) {
          toast.error(t('error.ROULETTE_FAILED'));
          return null;
        }
        if (spinResult.already_spun) {
          return { won: false, value: 0 };
        }
        const prizeIndex = spinResult.prize_index;
        const prizeAmount = ROULETTE_PRIZES[prizeIndex] ?? Number.parseInt(spinResult.phon_awarded, 10) ?? 0;
        const won = prizeAmount > 0;
        if (won) {
          toast.success(t('fomo.wheel.toast.win', { n: prizeAmount.toLocaleString() }));
        } else {
          toast(t('fomo.wheel.toast.miss'));
        }
        return { won, value: prizeAmount };
      },
    };
  }, [
    streak,
    canClaimToday,
    referralData,
    canSpinToday,
    spinning,
    rouletteLoading,
    claimDaily,
    spin,
    t,
  ]);

  const missionItems = useMemo(() => mergeMissionItems(missions), [missions]);

  const pageLoading =
    authLoading || dailyLoading || missionsLoading || referralLoading || rouletteLoading;

  return {
    t,
    authLoading,
    pageLoading,
    layoutLoading: authLoading,
    homeLoading: authLoading || dailyLoading || referralLoading,
    missionsLoading: authLoading || missionsLoading,
    layoutProps,
    homeProps,
    missionItems,
  };
}
