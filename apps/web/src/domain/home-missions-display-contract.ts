/**
 * `/home/missions` hub — E12 matrix tabs · onboarding claim handoff (§3.4.3 · §13.10).
 * Tab state lives on a single route (`tab` / `missionId` search) — no parallel tab routes (§24.4).
 */

import type { MessageKey } from '@phonara/i18n';
import type { MissionItem, MissionLane } from '@phonara/shared-types';

import { ONBOARDING_D0_MISSION_UI_ID } from './onboarding-journey-display-contract';
import {
  E12_CARD_LANES,
  shouldDeferMissionRow,
  VIRAL_MISSIONS_PRIMARY_ROUTE,
  VIRAL_UI_TO_RPC,
  REPEATABLE_UI_TO_RPC,
} from './viral-missions-display-contract';

export const HOME_MISSIONS_ROUTE = VIRAL_MISSIONS_PRIMARY_ROUTE;

export type HomeMissionsHubTabId =
  | 'daily'
  | 'viral'
  | 'weekly'
  | 'growth'
  | 'tier'
  | 'social'
  | 'special';

/** Default hub tab — viral-first (§13.10.2). */
export const HOME_MISSIONS_DEFAULT_TAB: HomeMissionsHubTabId = 'viral';

export const HOME_MISSIONS_HUB_TABS: readonly HomeMissionsHubTabId[] = [
  'viral',
  'daily',
  'weekly',
  'growth',
  'tier',
  'social',
  'special',
] as const;

export const HOME_MISSIONS_TAB_LABEL_KEYS: Readonly<Record<HomeMissionsHubTabId, MessageKey>> = {
  daily: 'mission.tab.daily',
  viral: 'mission.tab.viral',
  weekly: 'mission.tab.weekly',
  growth: 'mission.tab.growth',
  tier: 'mission.tab.tier',
  social: 'mission.tab.social',
  special: 'mission.tab.special',
};

/** Legacy path segments folded into hub `tab` search (§24.4). */
export const HOME_MISSIONS_TAB_PATH_ALIASES: Readonly<Record<string, HomeMissionsHubTabId>> = {
  daily: 'daily',
  weekly: 'weekly',
  special: 'special',
  viral: 'viral',
  growth: 'growth',
  tier: 'tier',
  social: 'social',
};

/** Welcome bonus claim is onboarding-only — hub duplicate claim 0 (§3.4.3). */
export const ONBOARDING_ONLY_CLAIM_UI_IDS = ['welcome-bonus', ONBOARDING_D0_MISSION_UI_ID] as const;

export type HomeMissionsHubSearch = {
  tab: HomeMissionsHubTabId;
  missionId?: string;
};

const TAB_SET = new Set<string>(HOME_MISSIONS_HUB_TABS);

export function isHomeMissionsHubTabId(value: unknown): value is HomeMissionsHubTabId {
  return typeof value === 'string' && TAB_SET.has(value);
}

export function parseHomeMissionsHubSearch(search: Record<string, unknown>): HomeMissionsHubSearch {
  const tabRaw = search['tab'];
  const tab = isHomeMissionsHubTabId(tabRaw) ? tabRaw : HOME_MISSIONS_DEFAULT_TAB;
  const missionIdRaw = search['missionId'];
  const missionId =
    typeof missionIdRaw === 'string' && missionIdRaw.trim() ? missionIdRaw.trim() : undefined;
  return { tab, missionId };
}

export function resolveHomeMissionsTabForLane(lane: MissionLane): HomeMissionsHubTabId {
  if (lane === 'daily') return 'daily';
  if (lane === 'growth') return 'growth';
  if ((E12_CARD_LANES as readonly string[]).includes(lane)) {
    return lane as HomeMissionsHubTabId;
  }
  return HOME_MISSIONS_DEFAULT_TAB;
}

export function resolveHomeMissionsTabForMissionId(missionId: string): HomeMissionsHubTabId | null {
  const itemLane = missionId.split('-')[0];
  if (itemLane === 'daily') return 'daily';
  if (itemLane === 'growth') return 'growth';
  if (itemLane === 'weekly') return 'weekly';
  if (itemLane === 'tier') return 'tier';
  if (itemLane === 'social') return 'social';
  if (itemLane === 'viral') return 'viral';
  return null;
}

export function isOnboardingOnlyClaimUiId(uiId: string): boolean {
  return (ONBOARDING_ONLY_CLAIM_UI_IDS as readonly string[]).includes(uiId);
}

/** Hide defer_stub / built_hidden rows and onboarding-only welcome claim surface. */
export function shouldRenderHomeMissionRow(uiId: string): boolean {
  if (isOnboardingOnlyClaimUiId(uiId)) return false;
  return !shouldDeferMissionRow(uiId);
}

export function filterHomeMissionsForTab(
  missions: readonly MissionItem[],
  tab: HomeMissionsHubTabId,
): MissionItem[] {
  if (tab === 'special') {
    return [];
  }

  return missions.filter((item) => {
    if (!shouldRenderHomeMissionRow(item.id)) return false;
    if (tab === 'growth') return item.lane === 'growth';
    return item.lane === tab;
  });
}

/** Deep-link CTA when mission is in_progress — engine one-shots use route handoff only. */
export function resolveHomeMissionCtaRoute(uiId: string): string | null {
  switch (uiId) {
    case 'viral-shareLink':
    case 'viral-invite3':
      return '/referral/invite';
    case 'viral-inviteWeekly':
      return '/share/earnings';
    case 'viral-partnerHubVisit':
      return '/referral';
    case 'growth-completeProfile':
      return '/account';
    case 'growth-firstDeposit':
      return '/wallet/deposit';
    case 'growth-firstGame':
      return '/casino';
    case 'growth-kyc':
      return '/account/kyc';
    case 'daily-todaySpin':
      return '/home';
    case 'weekly-play5':
    case 'weekly-win3':
      return '/casino';
    case 'weekly-depositOnce':
      return '/wallet/deposit';
    case 'weekly-loginAll':
      return '/home';
    case 'tier-reachSilver':
    case 'tier-reachGold':
    case 'tier-fomoStreak':
    case 'tier-keepStatus':
      return '/tier/me';
    default:
      return null;
  }
}

export function resolveHomeMissionViralRpc(uiId: string): string | null {
  return VIRAL_UI_TO_RPC[uiId] ?? null;
}

export function resolveHomeMissionRepeatableRpc(uiId: string): string | null {
  return REPEATABLE_UI_TO_RPC[uiId] ?? null;
}

export const HOME_MISSIONS_SEO_TITLE_KEY = 'earn.missions.head.title' as const satisfies MessageKey;
