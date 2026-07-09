import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ADS_ANALYTICS_CONSENT_STORAGE_KEY } from '@/domain/ads-attribution-display-contract';

const rpcMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

import {
  isAdsAnalyticsConsentGranted,
  persistAttributionSearch,
  readAdsAnalyticsConsent,
  readPersistedAttribution,
  syncAdsConsentToAccount,
  writeAdsAnalyticsConsent,
} from '@/lib/ads-attribution-consent';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  rpcMock.mockReset();
  rpcMock.mockResolvedValue({ error: null });
});

describe('ads-attribution-consent', () => {
  it('persists and reads analytics consent locally', () => {
    expect(readAdsAnalyticsConsent()).toBeNull();
    writeAdsAnalyticsConsent('granted');
    expect(readAdsAnalyticsConsent()).toBe('granted');
    expect(isAdsAnalyticsConsentGranted()).toBe(true);
  });

  it('stores attribution query keys in session storage', () => {
    persistAttributionSearch('utm_source=meta&fbclid=xyz&ignored=1');
    expect(readPersistedAttribution()).toEqual({
      utm_source: 'meta',
      fbclid: 'xyz',
    });
  });

  it('syncs consent via rpc_record_consent', async () => {
    await syncAdsConsentToAccount(true);
    expect(rpcMock).toHaveBeenCalledWith('rpc_record_consent', {
      p_doc_type: 'marketing_opt_in',
      p_doc_version: '1.0',
      p_accepted: true,
      p_ip_address: undefined,
      p_user_agent: expect.any(String),
      p_locale: expect.any(String),
    });
  });

  it('uses dedicated localStorage key', () => {
    writeAdsAnalyticsConsent('denied');
    expect(window.localStorage.getItem(ADS_ANALYTICS_CONSENT_STORAGE_KEY)).toBe('denied');
  });
});
