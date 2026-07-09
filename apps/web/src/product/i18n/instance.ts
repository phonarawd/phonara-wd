import { createI18n } from '@phonara/i18n/react';

import { WEB_LOCALE_STORAGE_KEY } from './constants';

const webI18n = createI18n({ storageKey: WEB_LOCALE_STORAGE_KEY });

export const I18nProvider = webI18n.I18nProvider;
export const useI18n = webI18n.useI18n;
export const useT = webI18n.useT;
