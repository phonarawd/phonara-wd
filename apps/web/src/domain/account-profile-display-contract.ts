/**
 * `/account/profile` — profile read/update · VIP tier badge (P8).
 * ENGINE:exists — `profiles` RLS read/update · `rpc_get_earn_hub_status` tier display.
 * Authority: plan §12.13 · §17.5 · ONBOARDING_JOURNEY_CANON D4
 */

import type { MessageKey } from '@phonara/i18n';

import { ACCOUNT_ROUTE, EARN_HUB_STATUS_RPC } from './unified-tier-display-contract';

export const ACCOUNT_PROFILE_ROUTE = '/account/profile' as const;

export const ACCOUNT_PROFILE_P8_TODO = 'p8-page-account-profile' as const;

/** §12.19.6 P8 gate manifest entry — TanStack route registered in same session. */
export const ACCOUNT_PROFILE_P8_MANIFEST_ROUTES = [ACCOUNT_PROFILE_ROUTE] as const;

export const ACCOUNT_PROFILE_BACK_ROUTE = ACCOUNT_ROUTE;

export const ACCOUNT_PROFILE_READ_HOOK = 'use-profile' as const;

export const ACCOUNT_PROFILE_TIER_RPC = EARN_HUB_STATUS_RPC;

export const ACCOUNT_PROFILE_USERNAME_MIN = 3 as const;
export const ACCOUNT_PROFILE_USERNAME_MAX = 32 as const;
export const ACCOUNT_PROFILE_DISPLAY_NAME_MAX = 64 as const;

const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export const ACCOUNT_PROFILE_SEO_TITLE_KEY =
  'seo.accountProfile.title' as const satisfies MessageKey;
export const ACCOUNT_PROFILE_SEO_DESCRIPTION_KEY =
  'seo.accountProfile.description' as const satisfies MessageKey;

export function normalizeProfileUsernameInput(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

export function normalizeProfileDisplayNameInput(value: string): string {
  return value.trim().replace(/\s{2,}/g, ' ');
}

export function profileUsernameGateKey(value: string): MessageKey | null {
  const normalized = normalizeProfileUsernameInput(value);
  if (!normalized) return 'account.profile.usernameRequired';
  if (normalized.length < ACCOUNT_PROFILE_USERNAME_MIN) {
    return 'account.profile.usernameTooShort';
  }
  if (normalized.length > ACCOUNT_PROFILE_USERNAME_MAX) {
    return 'account.profile.usernameTooLong';
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return 'account.profile.usernameInvalid';
  }
  return null;
}

export function profileDisplayNameGateKey(value: string): MessageKey | null {
  const normalized = normalizeProfileDisplayNameInput(value);
  if (normalized.length > ACCOUNT_PROFILE_DISPLAY_NAME_MAX) {
    return 'account.profile.displayNameTooLong';
  }
  return null;
}

export function resolveProfileDisplayLabel(params: {
  displayName: string | null | undefined;
  username: string | null | undefined;
  email: string | null | undefined;
}): string {
  const displayName = params.displayName?.trim();
  if (displayName) return displayName;
  const username = params.username?.trim();
  if (username) return username;
  const email = params.email?.trim();
  if (email) return email;
  return '';
}

export function mapProfileUpdateErrorCode(code: string | undefined): MessageKey {
  if (code === '23505') return 'account.profile.usernameTaken';
  return 'account.profile.saveError';
}
