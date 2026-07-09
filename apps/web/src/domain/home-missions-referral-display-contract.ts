/**
 * `/home/missions/referral` — curated referral-only high-reward missions (plan §13.10.2 · §17.3).
 * ENGINE:partial — viral/repeatable status/claim · referral read · `invite_3_friends` one-shot read.
 */

import type { MessageKey } from '@phonara/i18n';
import type { MissionItem } from '@phonara/shared-types';

import { HOME_MISSIONS_ROUTE, shouldRenderHomeMissionRow } from './home-missions-display-contract';

export const HOME_MISSIONS_REFERRAL_ROUTE = '/home/missions/referral' as const;

/** Plan §13.10.2 — partner hub · tier-gated referral rewards (no invite/share rows). */
export const HOME_MISSIONS_REFERRAL_UI_IDS = [
  'viral-partnerHubVisit',
  'tier-reachSilver',
  'tier-reachGold',
] as const;

export type HomeMissionsReferralUiId = (typeof HOME_MISSIONS_REFERRAL_UI_IDS)[number];

/** Engine one-shot — auto grant on qualified referrals (merged into viral-invite3 read path). */
export const HOME_MISSIONS_REFERRAL_ENGINE_ONE_SHOT = 'invite_3_friends' as const;

export const HOME_MISSIONS_REFERRAL_SEO_TITLE_KEY =
  'earn.missions.referral.head.title' as const satisfies MessageKey;

export const HOME_MISSIONS_REFERRAL_SEO_DESCRIPTION_KEY =
  'earn.missions.referral.head.desc' as const satisfies MessageKey;

const REFERRAL_UI_ID_SET = new Set<string>(HOME_MISSIONS_REFERRAL_UI_IDS);

export function isHomeMissionsReferralUiId(value: string): value is HomeMissionsReferralUiId {
  return REFERRAL_UI_ID_SET.has(value);
}

export function filterCuratedReferralMissionItems(missions: readonly MissionItem[]): MissionItem[] {
  return missions.filter(
    (item) => isHomeMissionsReferralUiId(item.id) && shouldRenderHomeMissionRow(item.id),
  );
}

export const HOME_MISSIONS_REFERRAL_BACK_SEARCH = { tab: 'viral' as const };

export function resolveHomeMissionsReferralBackRoute(): string {
  return `${HOME_MISSIONS_ROUTE}?tab=viral`;
}
