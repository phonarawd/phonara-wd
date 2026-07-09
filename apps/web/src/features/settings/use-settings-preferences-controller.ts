import { useCallback, useEffect, useState } from 'react';

import {
  applySettingsThemeToDocument,
  normalizeSettingsPreferencesLocale,
  normalizeSettingsTheme,
  readFiatHintEnabled,
  readSettingsTheme,
  resolveFiatHintEnabledToastKey,
  resolveSettingsPreferencesLocaleToastKey,
  type SettingsPreferencesLocaleOption,
  type SettingsThemeOption,
  writeFiatHintEnabled,
  writeSettingsTheme,
} from '@/domain/settings-preferences-display-contract';
import { useI18n, useT } from '@/product/i18n';
import { productToast } from '@/product/primitives/toast-zone';

export type SettingsPreferencesControllerView = {
  t: ReturnType<typeof useT>;
  displayLocale: SettingsPreferencesLocaleOption;
  theme: SettingsThemeOption;
  fiatHintEnabled: boolean;
  setDisplayLocale: (locale: SettingsPreferencesLocaleOption) => void;
  setTheme: (theme: SettingsThemeOption) => void;
  setFiatHintEnabled: (enabled: boolean) => void;
};

/** Canonical `/settings/preferences` — ui_only locale · theme (P8 · §25.8.2). */
export function useSettingsPreferencesController(): SettingsPreferencesControllerView {
  const t = useT();
  const { locale: uiLocale, setLocale } = useI18n();

  const [displayLocale, setDisplayLocaleState] = useState<SettingsPreferencesLocaleOption>(() =>
    normalizeSettingsPreferencesLocale(uiLocale),
  );
  const [theme, setThemeState] = useState<SettingsThemeOption>(() => readSettingsTheme());
  const [fiatHintEnabled, setFiatHintEnabledState] = useState<boolean>(() =>
    readFiatHintEnabled(uiLocale),
  );

  useEffect(() => {
    setDisplayLocaleState(normalizeSettingsPreferencesLocale(uiLocale));
    setFiatHintEnabledState(readFiatHintEnabled(uiLocale));
  }, [uiLocale]);

  const setDisplayLocale = useCallback(
    (nextLocale: SettingsPreferencesLocaleOption) => {
      const normalized = normalizeSettingsPreferencesLocale(nextLocale);
      if (normalized === displayLocale) return;
      setDisplayLocaleState(normalized);
      setLocale(normalized);
      productToast.show({
        zone: 'warm',
        key: resolveSettingsPreferencesLocaleToastKey(normalized),
      });
    },
    [displayLocale, setLocale],
  );

  const setTheme = useCallback(
    (nextTheme: SettingsThemeOption) => {
      const normalized = normalizeSettingsTheme(nextTheme);
      if (normalized === theme) return;
      writeSettingsTheme(normalized);
      applySettingsThemeToDocument(normalized);
      setThemeState(normalized);
      productToast.show({ zone: 'warm', key: 'settings.toast.themeApplied' });
    },
    [theme],
  );

  const setFiatHintEnabled = useCallback(
    (enabled: boolean) => {
      if (enabled === fiatHintEnabled) return;
      writeFiatHintEnabled(enabled);
      setFiatHintEnabledState(enabled);
      productToast.show({
        zone: 'warm',
        key: resolveFiatHintEnabledToastKey(enabled),
      });
    },
    [fiatHintEnabled],
  );

  return {
    t,
    displayLocale,
    theme,
    fiatHintEnabled,
    setDisplayLocale,
    setTheme,
    setFiatHintEnabled,
  };
}
