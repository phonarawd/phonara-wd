import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from '@tanstack/react-router';

import { isAdsAttributionRoute } from '@/domain/ads-attribution-display-contract';
import {
  isAdsAnalyticsConsentGranted,
  persistAttributionSearch,
  readAdsAnalyticsConsent,
  writeAdsAnalyticsConsent,
} from '@/lib/ads-attribution-consent';
import {
  hasConfiguredAdsPixels,
  loadAdsPixels,
  trackAdsViewContent,
} from '@/lib/ads-attribution-pixels';

type UseAdsAttributionChunkOptions = {
  /** Fire ViewContent after consent on `/` landing (§28.5). */
  trackViewContent?: boolean;
};

export type AdsAttributionChunkView = {
  showConsentSheet: boolean;
  acceptAnalytics: () => void;
  declineAnalytics: () => void;
};

export function useAdsAttributionChunk(
  options: UseAdsAttributionChunkOptions = {},
): AdsAttributionChunkView {
  const location = useLocation();
  const enabled = isAdsAttributionRoute(location.pathname);
  const [consentDecision, setConsentDecision] = useState(() => readAdsAnalyticsConsent());

  const pixelsConfigured = useMemo(() => hasConfiguredAdsPixels(), []);

  useEffect(() => {
    if (!enabled) return;
    persistAttributionSearch(location.searchStr);
  }, [enabled, location.searchStr]);

  useEffect(() => {
    if (!enabled || !pixelsConfigured) return;
    if (!isAdsAnalyticsConsentGranted()) return;
    loadAdsPixels();
    if (options.trackViewContent && location.pathname === '/') {
      trackAdsViewContent();
    }
  }, [enabled, location.pathname, options.trackViewContent, pixelsConfigured]);

  const acceptAnalytics = useCallback(() => {
    writeAdsAnalyticsConsent('granted');
    setConsentDecision('granted');
    if (pixelsConfigured) {
      loadAdsPixels();
      if (options.trackViewContent && location.pathname === '/') {
        trackAdsViewContent();
      }
    }
  }, [location.pathname, options.trackViewContent, pixelsConfigured]);

  const declineAnalytics = useCallback(() => {
    writeAdsAnalyticsConsent('denied');
    setConsentDecision('denied');
  }, []);

  const showConsentSheet =
    import.meta.env['VITE_PHONARA_E2E_ENGINE'] !== '1' &&
    enabled &&
    pixelsConfigured &&
    consentDecision === null;

  return {
    showConsentSheet,
    acceptAnalytics,
    declineAnalytics,
  };
}
