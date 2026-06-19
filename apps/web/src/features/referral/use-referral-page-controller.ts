import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { formatMoney } from '@/hooks/use-money';
import { useReferralDashboard } from '../../hooks/use-retention';
import { useAuth } from '../../contexts/auth-context';
import { useT } from '../../lib/i18n';
import { sumAmounts } from '../../lib/money-display';

export type ReferralPageViewProps = {
  referralCode: string;
  inviteUrl: string;
  pendingCount: number;
  approvedCount: number;
  paidPhonDisplay: string;
  onCopyCode: () => void;
};

export function useReferralPageController() {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { data, isLoading } = useReferralDashboard();

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  const viewProps = useMemo((): ReferralPageViewProps => {
    const referralCode = data?.code ?? '';
    const origin = typeof window === 'undefined' ? 'https://phonara.app' : window.location.origin;
    const paidTotal = sumAmounts(data?.paidPhon ?? []);

    return {
      referralCode,
      inviteUrl: referralCode ? `${origin}/r/${referralCode}` : origin,
      pendingCount: data?.pending ?? 0,
      approvedCount: data?.approved ?? 0,
      paidPhonDisplay: formatMoney(paidTotal, 'PHON'),
      onCopyCode: () => undefined,
    };
  }, [data]);

  const onCopyCode = useCallback(() => {
    if (!viewProps.referralCode) {
      toast.error(t('referral.codeUnavailable'));
      return;
    }
    void navigator.clipboard?.writeText(viewProps.referralCode);
    toast.success(t('referral.toast.codeCopied'));
  }, [viewProps.referralCode, t]);

  return {
    authLoading,
    pageLoading: authLoading || isLoading,
    viewProps: { ...viewProps, onCopyCode },
  };
}