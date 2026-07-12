import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import type { NotificationLocalPrefKey } from '@/domain/notifications-pwa-display-contract';
import {
  accountDeleteReasonGateKey,
  ACCOUNT_HUB_DELETE_RPC,
  ACCOUNT_HUB_NOTIFICATION_PREF_KEYS,
  readAccountHubNotificationPref,
  resolveAccountHubNavItems,
  resolveAccountAvatarInitial,
  resolveNotificationPrefToastKey,
  type AccountHubNavGroup,
  type AccountHubNavItem,
  writeAccountHubNotificationPref,
} from '@/domain/account-hub-display-contract';
import { resolveProfileDisplayLabel } from '@/domain/account-profile-display-contract';
import { parseEarnHubReferralSnapshot } from '@/domain/referral-hub-display-contract';
import {
  buildTierProgressView,
  parseEarnHubTierSnapshot,
  resolveTierCssVar,
  type TierProgressView,
} from '@/domain/tier-me-display-contract';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/use-profile';
import { signOut } from '@/lib/auth';
import { callRpc } from '@/lib/rpc';
import { translateError } from '@/lib/translate-error';
import { supabase } from '@/lib/supabase';
import { productToast } from '@/product/primitives/toast-zone';
import { useT } from '@/product/i18n';

export const accountHubPageKeys = {
  snapshot: (userId: string | null) => ['account-hub-snapshot', userId] as const,
};

type AccountHubSnapshot = {
  tierProgress: TierProgressView;
  qualifiedReferrals: number;
};

async function fetchAccountHubSnapshot(): Promise<AccountHubSnapshot> {
  const { data, error } = await supabase.rpc('rpc_get_earn_hub_status');
  if (error) throw error;

  const hubPayload = (data ?? {}) as Record<string, unknown>;
  const tierSnapshot = parseEarnHubTierSnapshot(hubPayload);
  if (!tierSnapshot) {
    throw new Error('TIER_SNAPSHOT_MISSING');
  }

  const referral = parseEarnHubReferralSnapshot(hubPayload);

  return {
    tierProgress: buildTierProgressView(tierSnapshot),
    qualifiedReferrals: referral?.qualifiedTotal ?? 0,
  };
}

export type AccountHubControllerView = {
  t: ReturnType<typeof useT>;
  loading: boolean;
  error: MessageKey | null;
  displayLabel: string;
  email: string;
  avatarInitial: string;
  joinedAt: string | null;
  tierProgress: TierProgressView | null;
  tierColorVar: string | null;
  qualifiedReferrals: number;
  navByGroup: Readonly<Record<AccountHubNavGroup, AccountHubNavItem[]>>;
  notificationPrefs: Readonly<Record<NotificationLocalPrefKey, boolean>>;
  logoutBusy: boolean;
  deleteBusy: boolean;
  setNotificationPref: (key: NotificationLocalPrefKey, enabled: boolean) => void;
  handleLogout: () => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
};

async function requestAccountDeletion(reason: string) {
  return callRpc(ACCOUNT_HUB_DELETE_RPC, { p_reason: reason });
}

/** Canonical `/account` hub — profile · KYC · RG · TopBar avatar target (P8). */
export function useAccountHubController(): AccountHubControllerView {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const email = session?.user.email ?? '';

  const { profile, loading: profileLoading } = useProfile();

  const {
    data: snapshot = null,
    isLoading: snapshotLoading,
    isError: snapshotError,
  } = useQuery({
    queryKey: accountHubPageKeys.snapshot(userId),
    queryFn: fetchAccountHubSnapshot,
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const [error, setError] = useState<MessageKey | null>(null);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<
    Record<NotificationLocalPrefKey, boolean>
  >(
    () =>
      Object.fromEntries(
        ACCOUNT_HUB_NOTIFICATION_PREF_KEYS.map((key) => [key, readAccountHubNotificationPref(key)]),
      ) as Record<NotificationLocalPrefKey, boolean>,
  );

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      void navigate({ to: '/login', replace: true });
    }
  }, [session, authLoading, navigate]);

  useEffect(() => {
    if (snapshotError) {
      setError('common.error.generic');
    }
  }, [snapshotError]);

  const displayLabel = useMemo(
    () =>
      resolveProfileDisplayLabel({
        displayName: profile?.display_name,
        username: profile?.username,
        email,
      }),
    [profile, email],
  );

  const avatarInitial = useMemo(
    () =>
      resolveAccountAvatarInitial({
        displayName: profile?.display_name,
        username: profile?.username,
        email,
        guestInitial: t('shell.account.guestInitial'),
      }),
    [profile, email, t],
  );

  const tierProgress = snapshot?.tierProgress ?? null;
  const tierColorVar = tierProgress ? resolveTierCssVar(tierProgress.tier) : null;
  const loading = authLoading || profileLoading || snapshotLoading;

  const navByGroup = useMemo(() => {
    const groups: Record<AccountHubNavGroup, AccountHubNavItem[]> = {
      profile: [],
      money: [],
      help: [],
    };
    for (const item of resolveAccountHubNavItems()) {
      groups[item.group].push(item);
    }
    return groups;
  }, []);

  const setNotificationPref = useCallback((key: NotificationLocalPrefKey, enabled: boolean) => {
    writeAccountHubNotificationPref(key, enabled);
    setNotificationPrefs((prev) => ({ ...prev, [key]: enabled }));
    productToast.show({
      zone: 'warm',
      key: resolveNotificationPrefToastKey(key, enabled),
    });
  }, []);

  const handleLogout = useCallback(async () => {
    if (logoutBusy) return;
    setLogoutBusy(true);
    setError(null);
    try {
      await signOut();
      await queryClient.clear();
      productToast.show({ zone: 'strict', key: 'account.toast.logoutDone' });
      void navigate({ to: '/login', replace: true });
    } catch (caught) {
      setError(translateError(caught, 'common.error.generic'));
    } finally {
      setLogoutBusy(false);
    }
  }, [logoutBusy, navigate, queryClient]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteBusy) return;
    const reason = window.prompt(t('account.delete.prompt')) ?? '';
    const gateKey = accountDeleteReasonGateKey(reason);
    if (gateKey) {
      productToast.show({ zone: 'strict', key: gateKey });
      return;
    }

    setDeleteBusy(true);
    setError(null);
    try {
      await requestAccountDeletion(reason.trim());
      productToast.show({ zone: 'strict', key: 'account.delete.submitted' });
    } catch (caught) {
      setError(translateError(caught, 'account.delete.failed'));
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteBusy, t]);

  return {
    t,
    loading,
    error,
    displayLabel,
    email,
    avatarInitial,
    joinedAt: profile?.created_at ?? null,
    tierProgress,
    tierColorVar,
    qualifiedReferrals: snapshot?.qualifiedReferrals ?? 0,
    navByGroup,
    notificationPrefs,
    logoutBusy,
    deleteBusy,
    setNotificationPref,
    handleLogout,
    handleDeleteAccount,
  };
}
