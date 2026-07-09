import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  resolveReferralShareCode,
  SETTINGS_REFERRAL_INVITE_ROUTE,
} from '@/domain/settings-referral-display-contract';
import { translateError } from '@/lib/translate-error';
import { supabase } from '@/lib/supabase';
import { productToast } from '@/product/primitives/toast-zone';
import { useT } from '@/product/i18n';

export const settingsReferralQueryKeys = {
  code: (userId: string | null) => ['settings-referral-code', userId] as const,
};

async function fetchSettingsReferralCode(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return resolveReferralShareCode(userId, data?.username ?? null);
}

export type SettingsReferralControllerView = {
  t: ReturnType<typeof useT>;
  loading: boolean;
  error: MessageKey | null;
  referralCode: string;
  inviteRoute: typeof SETTINGS_REFERRAL_INVITE_ROUTE;
  copyReferralCode: () => Promise<void>;
};

/** Canonical `/settings/referral` — referral code read · Link to `/referral/invite` only (P8). */
export function useSettingsReferralController(): SettingsReferralControllerView {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;

  const {
    data: referralCode = '',
    isLoading: codeLoading,
    error: queryError,
  } = useQuery({
    queryKey: settingsReferralQueryKeys.code(userId),
    queryFn: () => fetchSettingsReferralCode(userId!),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const copyReferralCode = useCallback(async () => {
    if (!referralCode) return;
    try {
      if (!navigator.clipboard?.writeText) {
        productToast.show({ zone: 'warm', key: 'referral.toast.clipboardUnavailable' });
        return;
      }
      await navigator.clipboard.writeText(referralCode);
      productToast.show({ zone: 'warm', key: 'referral.toast.codeCopied' });
    } catch {
      productToast.show({ zone: 'warm', key: 'referral.toast.clipboardUnavailable' });
    }
  }, [referralCode]);

  if (!authLoading && !session) {
    void navigate({ to: '/login', replace: true });
  }

  return {
    t,
    loading: authLoading || codeLoading,
    error: queryError ? translateError(queryError, 'error.UNKNOWN') : null,
    referralCode,
    inviteRoute: SETTINGS_REFERRAL_INVITE_ROUTE,
    copyReferralCode,
  };
}
