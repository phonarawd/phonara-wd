import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { MessageKey } from '@phonara/i18n';

import {
  activeSelfExclusionRow,
  buildDepositKrwLimitView,
  buildLossGameUsdtLimitView,
  depositKrwGateKey,
  formatRgDateTime,
  lossGameUsdtGateKey,
  normalizeKrwLimitInput,
  normalizeSelfExclusionDaysInput,
  normalizeUsdtLimitInput,
  selfExclusionDaysGateKey,
  selfExclusionUntilIso,
  toRpcKrwAmount,
  toRpcUsdtAmount,
  type RgLimitFieldView,
} from '@/features/account/rg-display';
import { loadRgSnapshot } from '@/features/responsible-gaming/rg-snapshot';
import { useAuth } from '@/contexts/auth-context';
import { setRgLimit, setSelfExclusion } from '@/domain/responsible-gaming';
import { translateError } from '@/lib/translate-error';
import { useI18n, useT } from '@/product/i18n';
import { productToast } from '@/product/primitives/toast-zone';

export type AccountRgControllerView = {
  t: (key: MessageKey) => string;
  loading: boolean;
  errorKey: MessageKey | null;
  depositLimit: RgLimitFieldView;
  lossLimit: RgLimitFieldView;
  selfExclusionActive: boolean;
  selfExclusionUntilDisplay: string | null;
  depositKrwInput: string;
  setDepositKrwInput: (value: string) => void;
  lossGameUsdtInput: string;
  setLossGameUsdtInput: (value: string) => void;
  selfExclusionDaysInput: string;
  setSelfExclusionDaysInput: (value: string) => void;
  depositKrwGateKey: MessageKey | null;
  lossGameUsdtGateKey: MessageKey | null;
  selfExclusionDaysGateKey: MessageKey | null;
  limitsSaveBusy: boolean;
  selfExclusionBusy: boolean;
  selfExclusionConfirmOpen: boolean;
  setSelfExclusionConfirmOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  handleSaveLimits: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleOpenSelfExclusionConfirm: () => void;
  handleConfirmSelfExclusion: () => Promise<void>;
};

const RG_SNAPSHOT_QUERY_KEY = 'account-rg-snapshot';

/** Canonical `/account/responsible-gaming` — RG limits read + user controls (P5). */
export function useAccountRgController(): AccountRgControllerView {
  const t = useT();
  const { locale } = useI18n();
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = session?.user.id ?? null;

  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [depositKrwInput, setDepositKrwInputRaw] = useState('');
  const [lossGameUsdtInput, setLossGameUsdtInputRaw] = useState('');
  const [selfExclusionDaysInput, setSelfExclusionDaysInputRaw] = useState('7');
  const [limitsSaveBusy, setLimitsSaveBusy] = useState(false);
  const [selfExclusionBusy, setSelfExclusionBusy] = useState(false);
  const [selfExclusionConfirmOpen, setSelfExclusionConfirmOpen] = useState(false);

  const {
    data: snapshot,
    isLoading: snapshotLoading,
    isError: snapshotError,
    refetch,
  } = useQuery({
    queryKey: [RG_SNAPSHOT_QUERY_KEY, userId],
    queryFn: () => loadRgSnapshot(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const setDepositKrwInput = useCallback((value: string) => {
    setDepositKrwInputRaw(normalizeKrwLimitInput(value));
  }, []);

  const setLossGameUsdtInput = useCallback((value: string) => {
    setLossGameUsdtInputRaw(normalizeUsdtLimitInput(value));
  }, []);

  const setSelfExclusionDaysInput = useCallback((value: string) => {
    setSelfExclusionDaysInputRaw(normalizeSelfExclusionDaysInput(value));
  }, []);

  const depositLimit = useMemo(
    () => buildDepositKrwLimitView(snapshot?.limits ?? [], locale),
    [snapshot?.limits, locale],
  );
  const lossLimit = useMemo(
    () => buildLossGameUsdtLimitView(snapshot?.limits ?? [], snapshot?.losses ?? [], locale),
    [snapshot?.limits, snapshot?.losses, locale],
  );

  const activeExclusion = useMemo(
    () => (snapshot ? activeSelfExclusionRow(snapshot.exclusions) : null),
    [snapshot],
  );
  const selfExclusionActive = activeExclusion !== null;
  const selfExclusionUntilDisplay = activeExclusion
    ? formatRgDateTime(activeExclusion.excluded_until, locale)
    : null;

  const depositKrwGate = depositKrwInput.trim() ? depositKrwGateKey(depositKrwInput) : null;
  const lossGameUsdtGate = lossGameUsdtInput.trim() ? lossGameUsdtGateKey(lossGameUsdtInput) : null;
  const selfExclusionDaysGate = selfExclusionDaysGateKey(selfExclusionDaysInput);

  const loading = authLoading || snapshotLoading;

  const refresh = useCallback(async () => {
    setErrorKey(null);
    try {
      await refetch();
    } catch {
      setErrorKey('common.error.generic');
    }
  }, [refetch]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      void navigate({ to: '/login', replace: true });
    }
  }, [session, authLoading, navigate]);

  useEffect(() => {
    if (snapshotError) {
      setErrorKey('common.error.generic');
    }
  }, [snapshotError]);

  const handleSaveLimits = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const depositGate = depositKrwInput.trim() ? depositKrwGateKey(depositKrwInput) : null;
      const lossGate = lossGameUsdtInput.trim() ? lossGameUsdtGateKey(lossGameUsdtInput) : null;
      if (depositGate || lossGate) return;
      if (!depositKrwInput.trim() && !lossGameUsdtInput.trim()) return;

      setLimitsSaveBusy(true);
      try {
        if (depositKrwInput.trim()) {
          await setRgLimit('deposit', '', 'KRW', toRpcKrwAmount(depositKrwInput));
        }
        if (lossGameUsdtInput.trim()) {
          await setRgLimit('loss', 'game', 'USDT', toRpcUsdtAmount(lossGameUsdtInput));
        }
        await queryClient.invalidateQueries({ queryKey: [RG_SNAPSHOT_QUERY_KEY, userId] });
        productToast.show({ zone: 'strict', key: 'rg.saveSuccess' });
        setDepositKrwInputRaw('');
        setLossGameUsdtInputRaw('');
      } catch (err) {
        productToast.show({ zone: 'strict', key: translateError(err, 'rg.saveError') });
      } finally {
        setLimitsSaveBusy(false);
      }
    },
    [depositKrwInput, lossGameUsdtInput, queryClient, t, userId],
  );

  const handleOpenSelfExclusionConfirm = useCallback(() => {
    if (selfExclusionDaysGateKey(selfExclusionDaysInput)) return;
    setSelfExclusionConfirmOpen(true);
  }, [selfExclusionDaysInput]);

  const handleConfirmSelfExclusion = useCallback(async () => {
    if (selfExclusionDaysGateKey(selfExclusionDaysInput)) return;
    setSelfExclusionBusy(true);
    try {
      await setSelfExclusion(
        selfExclusionUntilIso(selfExclusionDaysInput),
        t('rg.selfExclusion.defaultReason'),
      );
      await queryClient.invalidateQueries({ queryKey: [RG_SNAPSHOT_QUERY_KEY, userId] });
      productToast.show({ zone: 'strict', key: 'rg.selfExclusion.success' });
      setSelfExclusionConfirmOpen(false);
    } catch (err) {
      productToast.show({ zone: 'strict', key: translateError(err, 'rg.selfExclusion.error') });
    } finally {
      setSelfExclusionBusy(false);
    }
  }, [queryClient, selfExclusionDaysInput, t, userId]);

  return {
    t,
    loading,
    errorKey,
    depositLimit,
    lossLimit,
    selfExclusionActive,
    selfExclusionUntilDisplay,
    depositKrwInput,
    setDepositKrwInput,
    lossGameUsdtInput,
    setLossGameUsdtInput,
    selfExclusionDaysInput,
    setSelfExclusionDaysInput,
    depositKrwGateKey: depositKrwGate,
    lossGameUsdtGateKey: lossGameUsdtGate,
    selfExclusionDaysGateKey: selfExclusionDaysGate,
    limitsSaveBusy,
    selfExclusionBusy,
    selfExclusionConfirmOpen,
    setSelfExclusionConfirmOpen,
    refresh,
    handleSaveLimits,
    handleOpenSelfExclusionConfirm,
    handleConfirmSelfExclusion,
  };
}
