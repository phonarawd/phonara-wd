import { createI18n } from '@phonara/i18n/react';

import { ADMIN_LOCALE_STORAGE_KEY } from './constants';

const adminI18n = createI18n({ storageKey: ADMIN_LOCALE_STORAGE_KEY });

export const I18nProvider = adminI18n.I18nProvider;
export const useI18n = adminI18n.useI18n;
export const useT = adminI18n.useT;
