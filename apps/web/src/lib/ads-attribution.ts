import { ADS_PENDING_SIGNUP_STORAGE_KEY } from '@/domain/ads-attribution-display-contract';
import {
  isAdsAnalyticsConsentGranted,
  readAdsAnalyticsConsent,
  syncAdsConsentToAccount,
} from '@/lib/ads-attribution-consent';
import { loadAdsPixels, trackAdsSignupComplete } from '@/lib/ads-attribution-pixels';
import { trackLandingSignupCompleted } from '@/lib/landing-analytics';

type FinalizeAdsSignupAttributionOptions = {
  /** Email-verify handoff — only convert when signup flow set the pending marker. */
  requirePendingSignup?: boolean;
};

export function markPendingSignupConversion(): void {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return;
  window.sessionStorage.setItem(ADS_PENDING_SIGNUP_STORAGE_KEY, '1');
}

function consumePendingSignupConversion(): boolean {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return false;
  const pending = window.sessionStorage.getItem(ADS_PENDING_SIGNUP_STORAGE_KEY) === '1';
  if (pending) window.sessionStorage.removeItem(ADS_PENDING_SIGNUP_STORAGE_KEY);
  return pending;
}

/** Post-auth signup conversion — immediate signup + email-verify callback (§28.5). */
export async function finalizeAdsSignupAttribution(
  options: FinalizeAdsSignupAttributionOptions = {},
): Promise<void> {
  const shouldTrack = !options.requirePendingSignup || consumePendingSignupConversion();
  const adsConsent = readAdsAnalyticsConsent();

  if (shouldTrack && isAdsAnalyticsConsentGranted()) {
    loadAdsPixels();
    trackAdsSignupComplete();
    trackLandingSignupCompleted();
  }

  if (shouldTrack && adsConsent !== null) {
    try {
      await syncAdsConsentToAccount(adsConsent === 'granted');
    } catch {
      // account settings can retry marketing consent sync
    }
  }
}
