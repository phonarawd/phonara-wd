import { useCallback, useSyncExternalStore } from 'react';

import {
  readFiatHintEnabled,
  resolveDefaultFiatHintEnabled,
  SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_EVENT,
} from '@/domain/settings-preferences-display-contract';
import { useI18n } from '@/product/i18n';

function subscribeFiatHintPreference(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

/** Reactive read of `preferences.fiatHintEnabled` — locale default ko ON · en OFF when unset. */
export function useFiatHintPreference(): boolean {
  const { locale } = useI18n();

  const getSnapshot = useCallback(() => readFiatHintEnabled(locale), [locale]);
  const getServerSnapshot = useCallback(() => resolveDefaultFiatHintEnabled('ko'), []);

  return useSyncExternalStore(subscribeFiatHintPreference, getSnapshot, getServerSnapshot);
}
