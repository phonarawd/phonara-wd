import { describe, expect, it } from 'vitest';

import { translate } from '@phonara/i18n';

import { WEB_LOCALE_STORAGE_KEY } from '@/product/i18n/constants';

describe('product/i18n shell', () => {
  it('uses a stable per-app locale storage key', () => {
    expect(WEB_LOCALE_STORAGE_KEY).toBe('phonara.locale');
  });

  it('resolves shell chrome keys for ko and en', () => {
    expect(translate('ko', 'pwa.skipLink')).toBe('본문으로 건너뛰기');
    expect(translate('en', 'pwa.skipLink')).toBe('Skip to main content');
    expect(translate('ko', 'brand.wordmark')).toBe('phonara');
    expect(translate('en', 'brand.wordmark')).toBe('phonara');
  });
});
