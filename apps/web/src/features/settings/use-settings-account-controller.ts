import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  formatSettingsAccountTimezonePreview,
  normalizeSettingsAccountLocale,
  readSettingsAccountTimezone,
  resolveSettingsAccountLocaleToastKey,
  resolveSettingsAccountTimezoneOptions,
  type SettingsAccountLocaleOption,
  writeSettingsAccountTimezone,
} from '@/domain/settings-account-display-contract';
import { useProfile } from '@/hooks/use-profile';
import { translateError } from '@/lib/translate-error';
import { supabase } from '@/lib/supabase';
import { useI18n, useT } from '@/product/i18n';
import { productToast } from '@/product/primitives/toast-zone';

export type SettingsAccountControllerView = {
  t: ReturnType<typeof useT>;
  loading: boolean;
  error: MessageKey | null;
  accountLocale: SettingsAccountLocaleOption;
  timezone: string;
  timezoneOptions: readonly string[];
  timezonePreview: string;
  setAccountLocale: (locale: SettingsAccountLocaleOption) => Promise<void>;
  setTimezone: (timezone: string) => void;
  localeBusy: boolean;
};

/** Canonical `/settings/account` — profile locale (ENGINE) · timezone local SOT (P8). */
export function useSettingsAccountController(): SettingsAccountControllerView {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { locale: uiLocale, setLocale } = useI18n();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;

  const { profile, loading: profileLoading } = useProfile();

  const [error, setError] = useState<MessageKey | null>(null);
  const [timezone, setTimezoneState] = useState(() => readSettingsAccountTimezone());
  const [localeBusy, setLocaleBusy] = useState(false);
  const [hydratedProfileId, setHydratedProfileId] = useState<string | null>(null);
  const [accountLocale, setAccountLocaleState] = useState<SettingsAccountLocaleOption>(() =>
    normalizeSettingsAccountLocale(uiLocale),
  );

  useEffect(() => {
    if (!profile?.id || profile.id === hydratedProfileId) return;
    setAccountLocaleState(normalizeSettingsAccountLocale(profile.locale));
    setHydratedProfileId(profile.id);
  }, [profile, hydratedProfileId]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      void navigate({ to: '/login', replace: true });
    }
  }, [session, authLoading, navigate]);

  const timezoneOptions = useMemo(
    () => resolveSettingsAccountTimezoneOptions(timezone),
    [timezone],
  );

  const timezonePreview = useMemo(
    () => formatSettingsAccountTimezonePreview(new Date(), timezone, uiLocale),
    [timezone, uiLocale],
  );

  const setAccountLocale = useCallback(
    async (nextLocale: SettingsAccountLocaleOption) => {
      if (localeBusy || !userId || nextLocale === accountLocale) return;

      setLocaleBusy(true);
      setError(null);
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ locale: nextLocale })
          .eq('id', userId);

        if (updateError) {
          setError(translateError(updateError, 'settings.account.saveError'));
          return;
        }

        setAccountLocaleState(nextLocale);
        setLocale(nextLocale);
        await queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        productToast.show({
          zone: 'warm',
          key: resolveSettingsAccountLocaleToastKey(nextLocale),
        });
      } catch (caught) {
        setError(translateError(caught, 'settings.account.saveError'));
      } finally {
        setLocaleBusy(false);
      }
    },
    [accountLocale, localeBusy, queryClient, setLocale, userId],
  );

  const setTimezone = useCallback(
    (nextTimezone: string) => {
      if (nextTimezone === timezone) return;
      writeSettingsAccountTimezone(nextTimezone);
      setTimezoneState(nextTimezone);
      productToast.show({ zone: 'warm', key: 'settings.account.toast.timezoneSaved' });
    },
    [timezone],
  );

  return {
    t,
    loading: authLoading || profileLoading,
    error,
    accountLocale,
    timezone,
    timezoneOptions,
    timezonePreview,
    setAccountLocale,
    setTimezone,
    localeBusy,
  };
}
