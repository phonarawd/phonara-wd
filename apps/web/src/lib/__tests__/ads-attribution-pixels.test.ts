import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ADS_ATTRIBUTION_SESSION_STORAGE_KEY } from '@/domain/ads-attribution-display-contract';

import {
  configuredAdsPixelIds,
  loadAdsPixels,
  resetAdsPixelsForTests,
  trackAdsSignupComplete,
  trackAdsViewContent,
} from '@/lib/ads-attribution-pixels';

beforeEach(() => {
  resetAdsPixelsForTests();
  document.head.innerHTML = '';
  window.sessionStorage.clear();
  window.sessionStorage.setItem(
    ADS_ATTRIBUTION_SESSION_STORAGE_KEY,
    JSON.stringify({ utm_source: 'tiktok', ttclid: 'click-1' }),
  );
  window.ttq = undefined;
  window.fbq = undefined;
  window.gtag = undefined;
  window.TiktokAnalyticsObject = undefined;
  window.dataLayer = undefined;
  vi.unstubAllEnvs();
});

describe('ads-attribution-pixels', () => {
  it('returns empty ids when env vars are unset', () => {
    expect(configuredAdsPixelIds()).toEqual({});
  });

  it('reads configured pixel ids from env', () => {
    vi.stubEnv('VITE_TIKTOK_PIXEL_ID', ' TT-123 ');
    vi.stubEnv('VITE_META_PIXEL_ID', 'META-456');
    expect(configuredAdsPixelIds()).toEqual({
      tiktok: 'TT-123',
      meta: 'META-456',
    });
  });

  it('loads vendor scripts once and tracks conversion with attribution params', () => {
    vi.stubEnv('VITE_TIKTOK_PIXEL_ID', 'TT-123');
    vi.stubEnv('VITE_META_PIXEL_ID', 'META-456');
    vi.stubEnv('VITE_GOOGLE_TAG_ID', 'G-789');

    loadAdsPixels();
    loadAdsPixels();

    expect(document.getElementById('phonara-ttq-script')).toBeTruthy();
    expect(document.getElementById('phonara-fbq-script')).toBeTruthy();
    expect(document.getElementById('phonara-gtag-script')).toBeTruthy();

    const ttqTrack = vi.spyOn(window.ttq!, 'track');
    const fbq = vi.fn();
    window.fbq = fbq;
    const gtag = vi.fn();
    window.gtag = gtag;

    trackAdsViewContent();
    expect(ttqTrack).toHaveBeenCalledWith('ViewContent', {
      utm_source: 'tiktok',
      ttclid: 'click-1',
    });

    trackAdsSignupComplete();
    expect(fbq).toHaveBeenCalledWith('track', 'CompleteRegistration', {
      utm_source: 'tiktok',
      ttclid: 'click-1',
    });
    expect(gtag).toHaveBeenCalledWith('event', 'sign_up', {
      utm_source: 'tiktok',
      ttclid: 'click-1',
      method: 'email',
    });
  });
});
