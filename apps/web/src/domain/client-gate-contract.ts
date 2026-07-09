/**
 * Server gate ↔ client precheck parity (PQA F2 · Plan §33.3 #4).
 * Keep in sync with `supabase/migrations/20260723000001_client_gate_precheck_read.sql`.
 * Server RPCs remain authoritative — client blocks are pre-notice only (no hide-only).
 */
import type { MessageKey } from '@phonara/i18n';

import type { MfaAssuranceLevel } from './user-auth-security';
import { isFeatureKillSwitchOff } from './platform-gate-contract';

export const CLIENT_GATE_CONFIG_KEYS = [
  'consent_gate_enabled',
  'withdrawal_mfa_step_up_enabled',
  'geo_block_enabled',
] as const;

export type ClientGateConfigKey = (typeof CLIENT_GATE_CONFIG_KEYS)[number];

/** Matches SQL `feature_game_<slug>_enabled` keys (underscore slugs). */
export const PER_GAME_CONFIG_SLUGS = [
  'crash',
  'limbo',
  'dice',
  'mines',
  'hilo',
  'plinko',
  'mint_reels',
  'gold_rush',
  'roulette',
  'blackjack',
  'deepshaft',
  'momentum',
] as const;

export type PerGameConfigSlug = (typeof PER_GAME_CONFIG_SLUGS)[number];

export type ClientGateConfigMap = Record<ClientGateConfigKey, string | null> & {
  perGame: Record<PerGameConfigSlug, string | null>;
};

export function perGameConfigKey(
  slug: PerGameConfigSlug,
): `feature_game_${PerGameConfigSlug}_enabled` {
  return `feature_game_${slug}_enabled`;
}

export function allClientGateConfigSelectKeys(): string[] {
  return [
    ...CLIENT_GATE_CONFIG_KEYS,
    ...PER_GAME_CONFIG_SLUGS.map((slug) => perGameConfigKey(slug)),
  ];
}

export function isClientGateFlagOn(value: string | null | undefined): boolean {
  return value === 'true';
}

export function buildClientGateConfigMap(
  rows: ReadonlyArray<{ key: string; value: string | null }>,
): ClientGateConfigMap {
  const perGame = Object.fromEntries(PER_GAME_CONFIG_SLUGS.map((slug) => [slug, null])) as Record<
    PerGameConfigSlug,
    string | null
  >;

  const map = Object.fromEntries(CLIENT_GATE_CONFIG_KEYS.map((key) => [key, null])) as Record<
    ClientGateConfigKey,
    string | null
  >;

  for (const row of rows) {
    if (row.key in map) {
      map[row.key as ClientGateConfigKey] = row.value;
      continue;
    }
    for (const slug of PER_GAME_CONFIG_SLUGS) {
      if (row.key === perGameConfigKey(slug)) {
        perGame[slug] = row.value;
      }
    }
  }

  return { ...map, perGame };
}

export function resolveConsentGateBlocked(input: {
  consentGateEnabled: boolean;
  onboardingConsentComplete: boolean;
}): boolean {
  return input.consentGateEnabled && !input.onboardingConsentComplete;
}

export function resolveGeoAccessBlocked(input: {
  geoBlockEnabled: boolean;
  profileGeoBlocked: boolean;
}): boolean {
  return input.geoBlockEnabled && input.profileGeoBlocked;
}

export function resolveWithdrawalMfaStepUpRequired(input: {
  mfaStepUpEnabled: boolean;
  hasVerifiedTotp: boolean;
  currentAal: MfaAssuranceLevel | null;
}): boolean {
  if (!input.mfaStepUpEnabled) return false;
  if (!input.hasVerifiedTotp) return false;
  return input.currentAal !== 'aal2';
}

export function resolvePerGameCasinoBlocked(input: {
  aggregateCasinoBlocked: boolean;
  perGameEnabled: string | null;
}): { blocked: boolean; reasonKey: MessageKey | null } {
  if (input.aggregateCasinoBlocked) {
    return { blocked: true, reasonKey: 'gate.killswitch.casinoBlocked' };
  }
  if (isFeatureKillSwitchOff(input.perGameEnabled)) {
    return { blocked: true, reasonKey: 'gate.killswitch.gameOff' };
  }
  return { blocked: false, reasonKey: null };
}

export const CLIENT_GATE_REASON_KEYS = {
  consent: 'error.CONSENT_REQUIRED',
  geo: 'error.GEO_BLOCKED',
  withdrawalMfa: 'error.WITHDRAWAL_MFA_REQUIRED',
} as const satisfies Record<string, MessageKey>;
