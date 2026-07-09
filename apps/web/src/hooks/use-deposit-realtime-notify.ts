import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/auth-context';
import { useT } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { useRealtime } from './use-realtime';
import { walletKeys } from './use-wallet';
import { readDepositNotifPref } from '../features/wallet/deposit-notify-pref';
import type { DepositRail } from '../features/wallet/crypto-deposit-status';
import {
  depositCreditedAmountDisplay,
  depositCreditedNotificationId,
  depositStatusKey,
  depositStatusRef,
  resetDepositStatusBaselines,
  seedDepositStatusBaselines,
  shouldEmitDepositCreditedNotify,
  type DepositRealtimeRow,
} from '../features/wallet/deposit-realtime-notify';
import { useNotificationStore } from '../stores/notifications';

const DEPOSIT_BASELINE_QUERY_KEY = 'global-deposit-baselines';

function handleDepositRowChange(
  rail: DepositRail,
  payload: unknown,
  emit: ReturnType<typeof useNotificationStore.getState>['emitNotification'],
  t: ReturnType<typeof useT>,
): void {
  if (!readDepositNotifPref()) return;

  const row = (payload as { new?: DepositRealtimeRow }).new;
  if (!row?.id || !row.status) return;

  const key = depositStatusKey(rail, row.id);
  const previous = depositStatusRef.current.get(key);
  depositStatusRef.current.set(key, row.status);
  if (!shouldEmitDepositCreditedNotify(previous, row.status)) return;

  const { amount, currency } = depositCreditedAmountDisplay(rail, row);
  emit({
    id: depositCreditedNotificationId(rail, row.id),
    tone: 'success',
    title: t('notif.deposit.credited.title'),
    body: t('notif.deposit.credited.body', { amount, currency }),
    prefKey: 'deposit',
    toastZone: 'strict',
  });
}

/** App-wide deposit status realtime — credits toast + browser notify on any route. */
export function useDepositRealtimeNotify(): void {
  const t = useT();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const emitNotification = useNotificationStore((s) => s.emitNotification);

  const { data: baselines = [] } = useQuery({
    queryKey: [DEPOSIT_BASELINE_QUERY_KEY, userId],
    queryFn: async () => {
      const [krwRes, cryptoRes, giftRes] = await Promise.all([
        supabase
          .from('krw_deposit_requests')
          .select('id,status')
          .eq('user_id', userId!)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('crypto_deposit_requests')
          .select('id,status')
          .eq('user_id', userId!)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('giftcard_deposit_requests')
          .select('id,status')
          .eq('user_id', userId!)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);
      if (krwRes.error) throw krwRes.error;
      if (cryptoRes.error) throw cryptoRes.error;
      if (giftRes.error) throw giftRes.error;

      return [
        ...(krwRes.data ?? []).map((row) => ({
          rail: 'krw' as const,
          id: row.id,
          status: row.status,
        })),
        ...(cryptoRes.data ?? []).map((row) => ({
          rail: 'crypto' as const,
          id: row.id,
          status: row.status,
        })),
        ...(giftRes.data ?? []).map((row) => ({
          rail: 'giftcard' as const,
          id: row.id,
          status: row.status,
        })),
      ];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  useEffect(() => {
    resetDepositStatusBaselines();
  }, [userId]);

  useEffect(() => {
    if (!userId || baselines.length === 0) return;
    seedDepositStatusBaselines(baselines);
  }, [baselines, userId]);

  const onKrwChange = useCallback(
    (payload: unknown) => {
      handleDepositRowChange('krw', payload, emitNotification, t);
    },
    [emitNotification, t],
  );

  const onCryptoChange = useCallback(
    (payload: unknown) => {
      handleDepositRowChange('crypto', payload, emitNotification, t);
    },
    [emitNotification, t],
  );

  const onGiftcardChange = useCallback(
    (payload: unknown) => {
      handleDepositRowChange('giftcard', payload, emitNotification, t);
    },
    [emitNotification, t],
  );

  const filter = userId ? `user_id=eq.${userId}` : undefined;
  const walletInvalidate = userId ? [walletKeys.all(userId)] : undefined;

  useRealtime({
    table: 'krw_deposit_requests',
    filter,
    event: 'UPDATE',
    enabled: !!userId,
    invalidate: [['krw-deposits', userId], ...(walletInvalidate ?? [])],
    onChange: onKrwChange,
  });

  useRealtime({
    table: 'crypto_deposit_requests',
    filter,
    event: 'UPDATE',
    enabled: !!userId,
    invalidate: [['crypto-deposits', userId], ...(walletInvalidate ?? [])],
    onChange: onCryptoChange,
  });

  useRealtime({
    table: 'giftcard_deposit_requests',
    filter,
    event: 'UPDATE',
    enabled: !!userId,
    invalidate: [['giftcard-deposits', userId], ...(walletInvalidate ?? [])],
    onChange: onGiftcardChange,
  });
}
