import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useT } from '../../lib/i18n';
import { translateError } from '../../lib/translate-error';
import { setRgLimit, setSelfExclusion } from '../../domain/responsible-gaming';
import { normalizeDecimalInput } from '../../lib/money-input';
import { supabase } from '../../lib/supabase';

export type RgPageViewProps = {
  depositLimit: string;
  lossLimit: string;
  exclusionDays: string;
  busy: boolean;
  confirmOpen: boolean;
  onDepositLimitChange: (value: string) => void;
  onLossLimitChange: (value: string) => void;
  onExclusionDaysChange: (value: string) => void;
  onSaveLimits: () => void;
  onSelfExclusionStart: () => void;
  onConfirmSelfExclusion: () => void;
  onCancelSelfExclusion: () => void;
};

export function useRgPageController() {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [depositLimit, setDepositLimit] = useState('500000');
  const [lossLimit, setLossLimit] = useState('100');
  const [exclusionDays, setExclusionDays] = useState('7');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const { data, error } = await supabase
        .from('rg_user_limits')
        .select('limit_kind, domain, currency, current_limit')
        .eq('user_id', session.user.id);
      if (error) return;
      for (const row of data ?? []) {
        if (row.limit_kind === 'deposit' && row.currency === 'KRW') {
          setDepositLimit(String(row.current_limit));
        }
        if (row.limit_kind === 'loss' && row.domain === 'game' && row.currency === 'USDT') {
          setLossLimit(String(row.current_limit));
        }
      }
    })();
  }, [session]);

  const handleSaveLimits = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    try {
      await setRgLimit('deposit', '', 'KRW', depositLimit);
      await setRgLimit('loss', 'game', 'USDT', lossLimit);
      toast.success(t('rg.saveSuccess'));
    } catch (err: unknown) {
      toast.error(t(translateError(err, 'rg.saveError')));
    } finally {
      setBusy(false);
    }
  }, [session, depositLimit, lossLimit, t]);

  const handleSelfExclusion = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    try {
      const days = Number.parseInt(exclusionDays, 10);
      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      await setSelfExclusion(until, t('rg.selfExclusion.defaultReason'));
      toast.success(t('rg.selfExclusion.success'));
      setConfirmOpen(false);
    } catch (err: unknown) {
      toast.error(t(translateError(err, 'rg.selfExclusion.error')));
    } finally {
      setBusy(false);
    }
  }, [session, exclusionDays, t]);

  const viewProps: RgPageViewProps = {
    depositLimit,
    lossLimit,
    exclusionDays,
    busy,
    confirmOpen,
    onDepositLimitChange: (value) => setDepositLimit(normalizeDecimalInput(value)),
    onLossLimitChange: (value) => setLossLimit(normalizeDecimalInput(value)),
    onExclusionDaysChange: setExclusionDays,
    onSaveLimits: () => {
      void handleSaveLimits();
    },
    onSelfExclusionStart: () => setConfirmOpen(true),
    onConfirmSelfExclusion: () => {
      void handleSelfExclusion();
    },
    onCancelSelfExclusion: () => setConfirmOpen(false),
  };

  return {
    authLoading,
    sessionReady: !authLoading && !!session,
    viewProps,
  };
}
