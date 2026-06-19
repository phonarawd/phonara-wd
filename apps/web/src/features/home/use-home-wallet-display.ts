import { useMemo } from 'react';
import { formatMoney } from '@/hooks/use-money';
import { useAuth } from '@/contexts/auth-context';
import { useWallet } from '@/hooks/use-wallet';
import { useDailyClaim } from '@/hooks/use-retention';

const PRESENTATION_BALANCE = '₩1,284,500';
const PRESENTATION_TODAY_EARN = '+12,400P';
const PRESENTATION_STREAK_NOW = 5;
const PRESENTATION_STREAK_GOAL = 7;

export function useHomeWalletDisplay() {
  const { session } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const { streak, result: dailyResult } = useDailyClaim();
  const isLoggedIn = !!session;

  const balanceDisplay = useMemo(() => {
    if (!isLoggedIn) return PRESENTATION_BALANCE;
    if (walletLoading || !wallet) return '—';
    return `₩${formatMoney(wallet.krw_available, 'KRW')}`;
  }, [isLoggedIn, walletLoading, wallet]);

  const todayEarnDisplay = useMemo(() => {
    if (!isLoggedIn) return PRESENTATION_TODAY_EARN;
    const phon = dailyResult?.phon_awarded ?? '0';
    if (phon === '0' || phon === '0.000000') return '+0P';
    return `+${formatMoney(phon, 'PHON')}P`;
  }, [isLoggedIn, dailyResult?.phon_awarded]);

  const streakNow = isLoggedIn ? (streak?.current_streak ?? 0) : PRESENTATION_STREAK_NOW;
  const streakGoal = PRESENTATION_STREAK_GOAL;

  return {
    isLoggedIn,
    balanceDisplay,
    todayEarnDisplay,
    streakNow,
    streakGoal,
  };
}
