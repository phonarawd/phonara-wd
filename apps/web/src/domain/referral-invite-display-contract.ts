/**
 * Referral invite (`/referral/invite`) — canonical Web Share owner (plan §3.4 · §24.4).
 * Share payloads and capability probes only — rewards/quotas from engine RPC display.
 */

import type { MessageKey } from '@phonara/i18n';

import { REFERRAL_REGISTER_RPC } from './affiliate-partner-display-contract';
import { REFERRAL_INVITE_ROUTE } from './referral-hub-display-contract';

export { REFERRAL_INVITE_ROUTE };

/** Post-share viral claim path — `rpc_claim_viral_mission` mission id. */
export const REFERRAL_WEB_SHARE_MISSION_RPC = 'share_referral_link' as const;

/** Engine registration RPC — exists; wired on signup/auth callback. */
export const REFERRAL_INVITE_ENGINE_RPC = REFERRAL_REGISTER_RPC;

export type ReferralSharePayload = {
  title: string;
  text: string;
  url: string;
};

export type ReferralShareMissionSnapshot = {
  rewardPhon: string | null;
  used: number;
  max: number;
  remaining: number;
  canClaim: boolean;
};

/** Progressive enhancement — Web Share API is the canonical share path on this surface. */
export function canUseWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function buildReferralSharePayload(input: {
  shareTitle: string;
  shareText: string;
  inviteUrl: string;
}): ReferralSharePayload {
  return {
    title: input.shareTitle,
    text: input.shareText,
    url: input.inviteUrl,
  };
}

export function isReferralShareAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function resolveReferralShareMissionSnapshot(
  missions:
    | ReadonlyArray<{
        mission: string;
        used: number;
        max: number;
        remaining: number;
        reward_phon: string;
      }>
    | undefined,
): ReferralShareMissionSnapshot {
  const row = missions?.find((mission) => mission.mission === REFERRAL_WEB_SHARE_MISSION_RPC);
  if (!row) {
    return { rewardPhon: null, used: 0, max: 0, remaining: 0, canClaim: false };
  }
  return {
    rewardPhon: row.reward_phon ?? null,
    used: row.used ?? 0,
    max: row.max ?? 0,
    remaining: row.remaining ?? 0,
    canClaim: (row.remaining ?? 0) > 0,
  };
}

export const REFERRAL_INVITE_SEO_TITLE_KEY =
  'seo.referral.invite.title' as const satisfies MessageKey;
export const REFERRAL_INVITE_SEO_DESCRIPTION_KEY =
  'seo.referral.invite.description' as const satisfies MessageKey;
