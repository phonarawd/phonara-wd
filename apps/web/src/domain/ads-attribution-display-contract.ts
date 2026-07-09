/**
 * Ad pixel · attribution — Phase R P3 §28.5 (ui_only · engine 0).
 * TikTok / Meta / Google tags load only on `/` · `/signup` · `/login` after consent.
 */

import {
  LANDING_ATTRIBUTION_QUERY_KEYS,
  preserveLandingAttributionSearch,
} from '@/domain/landing-display-contract';

export const ADS_ATTRIBUTION_ENGINE_STATUS = 'ui_only' as const;

/** Routes allowed to host ad pixels — AppShell / in-app routes excluded (§28.5). */
export const ADS_ATTRIBUTION_ROUTES = ['/', '/signup', '/login'] as const;

export type AdsAttributionRoute = (typeof ADS_ATTRIBUTION_ROUTES)[number];

export const ADS_CONSENT_DOC_TYPE = 'marketing_opt_in' as const;

export const ADS_CONSENT_DOC_VERSION = '1.0' as const;

export const ADS_ANALYTICS_CONSENT_STORAGE_KEY = 'phonara.ads.analytics_consent' as const;

export const ADS_ATTRIBUTION_SESSION_STORAGE_KEY = 'phonara.ads.attribution' as const;

export const ADS_PENDING_SIGNUP_STORAGE_KEY = 'phonara.ads.pending_signup' as const;

export type AdsAnalyticsConsentDecision = 'granted' | 'denied';

export const ADS_PIXEL_ENV_KEYS = {
  tiktok: 'VITE_TIKTOK_PIXEL_ID',
  meta: 'VITE_META_PIXEL_ID',
  google: 'VITE_GOOGLE_TAG_ID',
} as const;

export const ADS_CONVERSION_EVENTS = {
  viewContent: 'ViewContent',
  completeRegistration: 'CompleteRegistration',
  signUp: 'SignUp',
} as const;

export function isAdsAttributionRoute(pathname: string): pathname is AdsAttributionRoute {
  return (ADS_ATTRIBUTION_ROUTES as readonly string[]).includes(pathname);
}

export function captureAttributionSearch(search: URLSearchParams | string): Record<string, string> {
  return preserveLandingAttributionSearch(search);
}

/** Event payload — attribution keys only; money fields forbidden (§28.5). */
export function buildAdsEventParams(attribution: Record<string, string>): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of LANDING_ATTRIBUTION_QUERY_KEYS) {
    const value = attribution[key];
    if (value) params[key] = value;
  }
  const variant = attribution['v'];
  if (variant === 'a' || variant === 'b') params['v'] = variant;
  return params;
}
