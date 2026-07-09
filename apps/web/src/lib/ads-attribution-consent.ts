import {
  ADS_ANALYTICS_CONSENT_STORAGE_KEY,
  ADS_ATTRIBUTION_SESSION_STORAGE_KEY,
  ADS_CONSENT_DOC_TYPE,
  ADS_CONSENT_DOC_VERSION,
  type AdsAnalyticsConsentDecision,
  captureAttributionSearch,
} from '@/domain/ads-attribution-display-contract';

import { supabase } from './supabase';

function hasBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readAdsAnalyticsConsent(): AdsAnalyticsConsentDecision | null {
  if (!hasBrowserStorage()) return null;
  const raw = window.localStorage.getItem(ADS_ANALYTICS_CONSENT_STORAGE_KEY);
  if (raw === 'granted' || raw === 'denied') return raw;
  return null;
}

export function writeAdsAnalyticsConsent(decision: AdsAnalyticsConsentDecision): void {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(ADS_ANALYTICS_CONSENT_STORAGE_KEY, decision);
}

export function isAdsAnalyticsConsentGranted(): boolean {
  return readAdsAnalyticsConsent() === 'granted';
}

export function persistAttributionSearch(search: URLSearchParams | string): void {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return;
  const captured = captureAttributionSearch(search);
  if (Object.keys(captured).length === 0) return;
  window.sessionStorage.setItem(ADS_ATTRIBUTION_SESSION_STORAGE_KEY, JSON.stringify(captured));
}

export function readPersistedAttribution(): Record<string, string> {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return {};
  const raw = window.sessionStorage.getItem(ADS_ATTRIBUTION_SESSION_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
}

function consentLocale(): 'ko' | 'en' {
  return globalThis.navigator?.language?.startsWith('ko') ? 'ko' : 'en';
}

/** Sync banner decision to append-only consent audit after authenticated signup (§28.5). */
export async function syncAdsConsentToAccount(accepted: boolean): Promise<void> {
  const { error } = await supabase.rpc('rpc_record_consent', {
    p_doc_type: ADS_CONSENT_DOC_TYPE,
    p_doc_version: ADS_CONSENT_DOC_VERSION,
    p_accepted: accepted,
    p_ip_address: undefined,
    p_user_agent: globalThis.navigator?.userAgent,
    p_locale: consentLocale(),
  });
  if (error) throw error;
}
