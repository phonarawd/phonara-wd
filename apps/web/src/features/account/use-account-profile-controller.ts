import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import {
  mapProfileUpdateErrorCode,
  normalizeProfileDisplayNameInput,
  normalizeProfileUsernameInput,
  profileDisplayNameGateKey,
  profileUsernameGateKey,
  resolveProfileDisplayLabel,
} from '@/domain/account-profile-display-contract';
import {
  buildTierProgressView,
  parseEarnHubTierSnapshot,
  resolveTierCssVar,
  type TierProgressView,
} from '@/domain/tier-me-display-contract';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/use-profile';
import { callRpc } from '@/lib/rpc';
import { translateError } from '@/lib/translate-error';
import { supabase } from '@/lib/supabase';
import { productToast } from '@/product/primitives/toast-zone';
import { useT } from '@/product/i18n';

export const accountProfilePageKeys = {
  tier: (userId: string | null) => ['account-profile-tier', userId] as const,
};

async function fetchAccountProfileTier(): Promise<TierProgressView | null> {
  const data = await callRpc('rpc_get_earn_hub_status');
  const snapshot = parseEarnHubTierSnapshot((data ?? {}) as Record<string, unknown>);
  return snapshot ? buildTierProgressView(snapshot) : null;
}

export type AccountProfileControllerView = {
  t: ReturnType<typeof useT>;
  loading: boolean;
  error: MessageKey | null;
  email: string;
  displayLabel: string;
  tierProgress: TierProgressView | null;
  tierColorVar: string | null;
  username: string;
  setUsername: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
  usernameGateKey: MessageKey | null;
  displayNameGateKey: MessageKey | null;
  submitBusy: boolean;
  profileComplete: boolean;
  refresh: () => Promise<void>;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

/** Canonical `/account/profile` — profile edit · VIP badge · complete_profile username (P8). */
export function useAccountProfileController(): AccountProfileControllerView {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const email = session?.user.email ?? '';

  const { profile, loading: profileLoading } = useProfile();
  const {
    data: tierProgress = null,
    isLoading: tierLoading,
    isError: tierError,
    refetch: refetchTier,
  } = useQuery({
    queryKey: accountProfilePageKeys.tier(userId),
    queryFn: fetchAccountProfileTier,
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const [error, setError] = useState<MessageKey | null>(null);
  const [username, setUsernameRaw] = useState('');
  const [displayName, setDisplayNameRaw] = useState('');
  const [submitBusy, setSubmitBusy] = useState(false);
  const [hydratedProfileId, setHydratedProfileId] = useState<string | null>(null);

  const setUsername = useCallback((value: string) => {
    setUsernameRaw(normalizeProfileUsernameInput(value));
  }, []);

  const setDisplayName = useCallback((value: string) => {
    setDisplayNameRaw(value);
  }, []);

  useEffect(() => {
    if (!profile?.id || profile.id === hydratedProfileId) return;
    setUsernameRaw(profile.username ?? '');
    setDisplayNameRaw(profile.display_name ?? '');
    setHydratedProfileId(profile.id);
  }, [profile, hydratedProfileId]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      void navigate({ to: '/login', replace: true });
    }
  }, [session, authLoading, navigate]);

  useEffect(() => {
    if (tierError) {
      setError('common.error.generic');
    }
  }, [tierError]);

  const usernameGateKey = profileUsernameGateKey(username);
  const displayNameGateKey = profileDisplayNameGateKey(displayName);

  const displayLabel = useMemo(
    () =>
      resolveProfileDisplayLabel({
        displayName,
        username,
        email,
      }),
    [displayName, username, email],
  );

  const tierColorVar = tierProgress ? resolveTierCssVar(tierProgress.tier) : null;
  const profileComplete = Boolean(profile?.username?.trim());
  const loading = authLoading || profileLoading || tierLoading;

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
        refetchTier(),
      ]);
    } catch {
      setError('common.error.generic');
    }
  }, [queryClient, refetchTier, userId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitBusy || !userId) return;
    if (usernameGateKey || displayNameGateKey) return;

    const nextUsername = normalizeProfileUsernameInput(username);
    const nextDisplayName = normalizeProfileDisplayNameInput(displayName);

    setSubmitBusy(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: nextUsername,
          display_name: nextDisplayName || null,
        })
        .eq('id', userId);

      if (updateError) {
        const mapped = mapProfileUpdateErrorCode(updateError.code);
        if (mapped === 'account.profile.saveError') {
          setError(translateError(updateError, 'account.profile.saveError'));
        } else {
          setError(mapped);
        }
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      productToast.show({ zone: 'strict', key: 'account.profile.saveOk' });
    } catch (caught) {
      setError(translateError(caught, 'account.profile.saveError'));
    } finally {
      setSubmitBusy(false);
    }
  }

  return {
    t,
    loading,
    error,
    email,
    displayLabel,
    tierProgress,
    tierColorVar,
    username,
    setUsername,
    displayName,
    setDisplayName,
    usernameGateKey,
    displayNameGateKey,
    submitBusy,
    profileComplete,
    refresh,
    handleSubmit,
  };
}
