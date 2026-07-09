/**
 * `/home/missions/invite` — curated viral invite missions (plan section 13.10.2 viral lane).
 * ENGINE:partial — viral status/claim · referral read · `invite_3_friends` one-shot read.
 */

import type { MessageKey } from '@phonara/i18n';
import type { MissionItem } from '@phonara/shared-types';

import { HOME_MISSIONS_ROUTE, shouldRenderHomeMissionRow } from './home-missions-display-contract';

export const HOME_MISSIONS_INVITE_ROUTE = '/home/missions/invite' as const;

/** Plan section 13.10.2 — share · signup · streak share (no defer_stub / affiliate rows). */
export const HOME_MISSIONS_INVITE_UI_IDS = [
  'viral-shareLink',
  'viral-invite3',
  'viral-inviteWeekly',
] as const;

export type HomeMissionsInviteUiId = (typeof HOME_MISSIONS_INVITE_UI_IDS)[number];

/** Engine one-shot — auto grant on qualified referrals (card = completed read-only). */
export const HOME_MISSIONS_INVITE_ENGINE_ONE_SHOT = 'invite_3_friends' as const;

export const HOME_MISSIONS_INVITE_SEO_TITLE_KEY =
  'earn.missions.invite.head.title' as const satisfies MessageKey;

export const HOME_MISSIONS_INVITE_SEO_DESCRIPTION_KEY =
  'earn.missions.invite.head.desc' as const satisfies MessageKey;

const INVITE_UI_ID_SET = new Set<string>(HOME_MISSIONS_INVITE_UI_IDS);

export function isHomeMissionsInviteUiId(value: string): value is HomeMissionsInviteUiId {
  return INVITE_UI_ID_SET.has(value);
}

export function filterCuratedInviteMissionItems(missions: readonly MissionItem[]): MissionItem[] {
  return missions.filter(
    (item) => isHomeMissionsInviteUiId(item.id) && shouldRenderHomeMissionRow(item.id),
  );
}

export const HOME_MISSIONS_INVITE_BACK_SEARCH = { tab: 'viral' as const };

export function resolveHomeMissionsInviteBackRoute(): string {
  return `${HOME_MISSIONS_ROUTE}?tab=viral`;
}
