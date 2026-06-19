import {
  DEFAULT_LOCALE,
  messages,
  translate,
  type Locale,
} from '@phonara/i18n';

let current: Locale = DEFAULT_LOCALE;

export type { Locale };

export const setLocale = (l: Locale) => {
  current = l;
};

export const getLocale = () => current;

/** Presentation shim — merged @phonara/i18n catalog (incl. lovable admin keys). */
export const t = (key: string, vars?: Record<string, string | number>) =>
  translate(current, key as keyof (typeof messages)['ko'], vars);

export { messages };
