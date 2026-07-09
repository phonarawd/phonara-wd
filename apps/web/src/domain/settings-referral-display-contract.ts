/**
 * `/settings/referral` — referral code read · invite Link CTA only (plan §3.4.3).
 * ENGINE:exists — code from `profiles.username` with UUID-prefix fallback (`resolveReferralShareCode`).
 * Web Share is forbidden on this surface; canonical owner is `/referral/invite`.
 */

import type { MessageKey } from '@phonara/i18n';

import { REFERRAL_REGISTER_RPC } from './affiliate-partner-display-contract';
import { REFERRAL_INVITE_ROUTE, resolveReferralShareCode } from './referral-hub-display-contract';

export const SETTINGS_REFERRAL_ROUTE = '/settings/referral' as const;

export { REFERRAL_INVITE_ROUTE as SETTINGS_REFERRAL_INVITE_ROUTE, resolveReferralShareCode };

/** Registration RPC exists; code read uses profile username (same lookup as `rpc_register_referral`). */
export const SETTINGS_REFERRAL_CODE_READ_ENGINE_RPC = REFERRAL_REGISTER_RPC;

export const SETTINGS_REFERRAL_SURFACE_CTA = 'link-only' as const;

export type SettingsReferralSurfaceCta = typeof SETTINGS_REFERRAL_SURFACE_CTA;

/** Non-waivable — `/settings/referral` must never expose Web Share (§3.4.3 · D-4). */
export const SETTINGS_REFERRAL_FORBIDS_WEB_SHARE = true as const;

export function resolveSettingsReferralInviteRoute(): typeof REFERRAL_INVITE_ROUTE {
  return REFERRAL_INVITE_ROUTE;
}

export function assertSettingsReferralForbidsWebShare(): void {
  if (!SETTINGS_REFERRAL_FORBIDS_WEB_SHARE) {
    throw new Error('settings-referral: Web Share must remain forbidden on /settings/referral');
  }
}

export const SETTINGS_REFERRAL_SEO_TITLE_KEY =
  'seo.settingsReferral.title' as const satisfies MessageKey;
export const SETTINGS_REFERRAL_SEO_DESCRIPTION_KEY =
  'seo.settingsReferral.description' as const satisfies MessageKey;
