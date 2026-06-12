import { createI18n, type I18nContextValue, type TranslateFn } from '@phonara/i18n/react';

const i18n = createI18n({ storageKey: 'phonara-admin.locale', detectNavigatorLanguage: true });

export const I18nProvider = i18n.I18nProvider;
export const useI18n = i18n.useI18n;
export const useT = i18n.useT;
export type { I18nContextValue, TranslateFn };
