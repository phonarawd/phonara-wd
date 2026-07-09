import { describe, expect, it } from 'vitest';

import {
  ADS_ATTRIBUTION_ROUTES,
  ADS_CONSENT_DOC_TYPE,
  buildAdsEventParams,
  captureAttributionSearch,
  isAdsAttributionRoute,
} from '@/domain/ads-attribution-display-contract';

describe('ads-attribution-display-contract', () => {
  it('limits pixel routes to landing and auth funnel', () => {
    expect(ADS_ATTRIBUTION_ROUTES).toEqual(['/', '/signup', '/login']);
    expect(isAdsAttributionRoute('/')).toBe(true);
    expect(isAdsAttributionRoute('/signup')).toBe(true);
    expect(isAdsAttributionRoute('/home')).toBe(false);
  });

  it('reuses marketing_opt_in for server consent sync', () => {
    expect(ADS_CONSENT_DOC_TYPE).toBe('marketing_opt_in');
  });

  it('builds event params from attribution keys without money fields', () => {
    const params = buildAdsEventParams(
      captureAttributionSearch('utm_source=tiktok&fbclid=abc&gclid=123&balance=999'),
    );
    expect(params).toEqual({
      utm_source: 'tiktok',
      fbclid: 'abc',
      gclid: '123',
    });
    expect(params).not.toHaveProperty('balance');
  });
});
