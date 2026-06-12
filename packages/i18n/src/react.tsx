import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_LOCALE, translate, type Locale, type MessageKey } from './index';

export type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
}

export interface CreateI18nOptions {
  /** localStorage key the locale preference is persisted under (per app). */
  storageKey: string;
  /** When no stored preference exists, infer the initial locale from the browser. */
  detectNavigatorLanguage?: boolean;
}

export function createI18n({ storageKey, detectNavigatorLanguage = false }: CreateI18nOptions) {
  const I18nContext = createContext<I18nContextValue | null>(null);

  function readInitialLocale(): Locale {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'ko' || stored === 'en') return stored;
    if (detectNavigatorLanguage) {
      const nav = window.navigator.language.toLowerCase();
      return nav.startsWith('en') ? 'en' : DEFAULT_LOCALE;
    }
    return DEFAULT_LOCALE;
  }

  function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

    useEffect(() => {
      document.documentElement.lang = locale;
    }, [locale]);

    const setLocale = useCallback((next: Locale) => {
      setLocaleState(next);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, next);
        document.documentElement.lang = next;
      }
    }, []);

    const t = useCallback<TranslateFn>((key, vars) => translate(locale, key, vars), [locale]);

    const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
  }

  function useI18n(): I18nContextValue {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
    return ctx;
  }

  function useT(): TranslateFn {
    return useI18n().t;
  }

  return { I18nProvider, useI18n, useT };
}
