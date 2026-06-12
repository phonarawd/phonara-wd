import { supabase } from './supabase';

/** Matches `legal.*` effective date in terms/privacy routes. */
export const ONBOARDING_CONSENT_DOC_VERSION = '2026-06-11';

export const MANDATORY_ONBOARDING_CONSENT_DOCS = [
  'terms_of_service',
  'privacy_policy',
  'risk_disclosure',
  'age_verification',
] as const;

type OnboardingConsentCheck = {
  complete?: boolean;
};

function consentLocale(): 'ko' | 'en' {
  return globalThis.navigator?.language?.startsWith('ko') ? 'ko' : 'en';
}

/** Records mandatory onboarding consents via rpc_record_consent (append-only audit). */
export async function recordOnboardingConsents(): Promise<void> {
  const locale = consentLocale();
  const userAgent = globalThis.navigator?.userAgent;

  for (const docType of MANDATORY_ONBOARDING_CONSENT_DOCS) {
    const { error } = await supabase.rpc('rpc_record_consent', {
      p_doc_type: docType,
      p_doc_version: ONBOARDING_CONSENT_DOC_VERSION,
      p_accepted: true,
      p_ip_address: undefined,
      p_user_agent: userAgent,
      p_locale: locale,
    });
    if (error) throw error;
  }
}

/** Idempotent: skips RPC writes when rpc_check_onboarding_consent already passes. */
export async function ensureOnboardingConsents(): Promise<void> {
  const { data, error } = await supabase.rpc('rpc_check_onboarding_consent');
  if (error) throw error;
  const check = data as OnboardingConsentCheck;
  if (check.complete) return;
  await recordOnboardingConsents();
}
