/**
 * Landing LIVE proof — Phase 4 (L0b momentum · L1 feed · ADR-003 defer resolved).
 * Uses anon-safe `rpc_list_cms_content` — no new engine migrations.
 */

import { CMS_LIST_RPC } from '@/domain/cms-banners-display-contract';
import { EARN_ACTIVITY_FEED_RPC } from '@/domain/earn-home-display-contract';

export const LANDING_LIVE_ENGINE_STATUS = 'ui_only' as const;

export const LANDING_LIVE_PROOF_ENV_KEY = 'VITE_PHONARA_LANDING_PROOF_MODE' as const;

export const LANDING_LIVE_PROOF_MODES = ['presentation', 'live'] as const;

export type LandingLiveProofMode = (typeof LANDING_LIVE_PROOF_MODES)[number];

export const LANDING_LIVE_CMS_KIND = 'landing_proof' as const;

export const LANDING_LIVE_CMS_SURFACE = 'landing' as const;

export const LANDING_LIVE_WITHDRAWAL_MOMENTUM_KEY = 'withdrawal_momentum' as const;

export const LANDING_LIVE_MEMBER_COUNT_KEY = 'member_count' as const;

export const LANDING_LIVE_RPC_BRANCHES = {
  withdrawalMomentum: { rpc: CMS_LIST_RPC, moneyPath: false },
  memberCount: { rpc: CMS_LIST_RPC, moneyPath: false },
  activityFeed: { rpc: EARN_ACTIVITY_FEED_RPC, moneyPath: false, requiresAuth: true },
} as const;

export function resolveLandingLiveProofModeFromEnv(
  env: Record<string, string | undefined> = import.meta.env,
): LandingLiveProofMode {
  const raw = env[LANDING_LIVE_PROOF_ENV_KEY]?.trim().toLowerCase();
  return raw === 'live' ? 'live' : 'presentation';
}

export function parseLandingLiveCmsCount(body: string | null | undefined): number | null {
  if (!body) return null;
  const digits = body.replace(/[^\d]/g, '');
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function findLandingLiveCmsRow<T extends { content_key: string; body: string | null }>(
  rows: readonly T[],
  contentKey: string,
): T | undefined {
  return rows.find((row) => row.content_key === contentKey);
}
