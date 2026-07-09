/**

 * `/home` Earn hub — P8 canonical surface (`p8-page-home`).

 * Single route owner · parallel hub 0 · ENGINE display-only reads.

 *

 * Authority: EARN_UX_CANON.md · HOME_UX_CANON.md · Plan §25.12.8 · §28.7

 */

import type { MessageKey } from '@phonara/i18n';

import { EARN_STATIC_MISSIONS } from '@/data/earn-static-missions';

import { HOME_MISSIONS_ROUTE } from './home-missions-display-contract';

import { HOME_ATTENDANCE_ROUTE } from './home-attendance-display-contract';

import { REFERRAL_HUB_ROUTE } from './referral-hub-display-contract';

import { SHARE_EARNINGS_ROUTE } from './share-earnings-display-contract';

import { TIER_BENEFITS_ROUTE } from './tier-benefits-display-contract';

import { TIER_ME_ROUTE } from './tier-me-display-contract';

import { STAKING_HUB_ROUTE } from './staking-display-contract';

import { formatLandingPhonAmount, parseLandingRewardPhon } from './landing-display-contract';

import {
  buildTierProgressView,
  parseEarnHubTierSnapshot,
  type TierProgressView,
} from './tier-me-display-contract';

import { EARN_HUB_STATUS_RPC, HOME_ROUTE, WALLET_ROUTE } from './unified-tier-display-contract';

import {
  resolveRewardTicketsIssuanceNoteKey,
  shouldShowRewardTicketsIssuanceNote,
} from './dead-controls-display-contract';
import { shouldDeferMissionRow, formatPhonRewardDisplay } from './viral-missions-display-contract';

export const EARN_HOME_CANONICAL_ROUTE = HOME_ROUTE;

export const EARN_ACTIVITY_FEED_RPC = 'rpc_get_earn_activity_feed' as const;

export const EARN_HOME_P6_ROUTE_OWNER = 'apps/web/src/routes/home.tsx' as const;

export const EARN_HOME_P8_SURFACE_OWNER =
  'apps/web/src/product/surfaces/home/earn-home-page.tsx' as const;

export const EARN_HOME_P8_CONTROLLER_OWNER =
  'apps/web/src/features/earn/use-earn-home-page-controller.ts' as const;

export const EARN_HOME_P8_REPLACEMENT_TODO = 'p8-page-home' as const;

/** §28.7 — ambient default · live swaps to `rpc_get_earn_activity_feed` when enabled. */

export type EarnHomeProofMode = 'ambient' | 'live';

export const EARN_HOME_PROOF_MODE: EarnHomeProofMode = 'ambient';

export const EARN_HOME_PROOF_ENV_KEY = 'VITE_PHONARA_EARN_HOME_PROOF_MODE' as const;

export type EarnHomeEngineBranch = 'hub_status_read' | 'activity_feed_read';

export type EarnHomeEngineStatus = 'exists' | 'partial' | 'missing';

export const EARN_HOME_ENGINE_BRANCHES: Readonly<
  Record<EarnHomeEngineBranch, { engine: EarnHomeEngineStatus; rpc: string; moneyPath: boolean }>
> = {
  hub_status_read: { engine: 'exists', rpc: EARN_HUB_STATUS_RPC, moneyPath: false },

  activity_feed_read: { engine: 'exists', rpc: EARN_ACTIVITY_FEED_RPC, moneyPath: false },
};

export const EARN_HOME_UI_WIRE_STATUS = 'wired' as const;

/** BottomNav Tab1 — nav.earn → /home (nav.home forbidden · §12.19.4). */

export const EARN_HOME_BOTTOM_NAV = {
  labelKey: 'nav.earn',

  to: EARN_HOME_CANONICAL_ROUTE,
} as const;

/** §12.19.6 P6 manifest — only /home chip visible until P7 extends routes. */

export const EARN_HOME_P6_SUBNAV_MANIFEST_ROUTES = [EARN_HOME_CANONICAL_ROUTE] as const;

/** §12.19.6 P7 manifest — registered earn chips. */

export const EARN_HOME_P7_SUBNAV_MANIFEST_ROUTES = [
  EARN_HOME_CANONICAL_ROUTE,

  HOME_MISSIONS_ROUTE,

  HOME_ATTENDANCE_ROUTE,

  REFERRAL_HUB_ROUTE,

  TIER_ME_ROUTE,

  TIER_BENEFITS_ROUTE,

  SHARE_EARNINGS_ROUTE,

  STAKING_HUB_ROUTE,
] as const;

/** Redirect-only aliases — standalone parallel hub rebuild forbidden. */

export const EARN_HOME_REDIRECT_ALIASES = ['/earn', '/dashboard'] as const;

/** Hub mission preview rows — LIVE catalog subset (§25.12.8 card grid). */

export const EARN_HOME_HUB_MISSION_PREVIEW_IDS = [
  'daily-todaySpin',

  'daily-quiz',

  'viral-shareLink',

  'growth-completeProfile',
] as const;

export type EarnHomeHubMissionPreviewId = (typeof EARN_HOME_HUB_MISSION_PREVIEW_IDS)[number];

export type EarnHomeEntryCardId = 'missions' | 'events' | 'wallet' | 'bet';

export type EarnHomeEntryCardDefinition = {
  id: EarnHomeEntryCardId;

  titleKey: MessageKey;

  bodyKey: MessageKey;

  ctaKey: MessageKey;

  route: string;
};

export const EARN_HOME_ENTRY_CARDS: readonly EarnHomeEntryCardDefinition[] = [
  {
    id: 'missions',

    titleKey: 'earn.home.entry.missions.title',

    bodyKey: 'earn.home.entry.missions.body',

    ctaKey: 'earn.home.entry.missions.cta',

    route: HOME_MISSIONS_ROUTE,
  },

  {
    id: 'events',

    titleKey: 'earn.home.entry.events.title',

    bodyKey: 'earn.home.entry.events.body',

    ctaKey: 'earn.home.entry.events.cta',

    route: HOME_ATTENDANCE_ROUTE,
  },

  {
    id: 'wallet',

    titleKey: 'earn.home.entry.wallet.title',

    bodyKey: 'earn.home.entry.wallet.body',

    ctaKey: 'earn.home.entry.wallet.cta',

    route: WALLET_ROUTE,
  },

  {
    id: 'bet',

    titleKey: 'earn.home.entry.bet.title',

    bodyKey: 'earn.home.entry.bet.body',

    ctaKey: 'earn.home.entry.bet.cta',

    route: '/sports',
  },
] as const;

export type EarnHomeNextActionKind = 'attendance' | 'roulette' | 'mission_claim' | 'missions';

export type EarnHomeNextActionView = {
  kind: EarnHomeNextActionKind;

  titleKey: MessageKey;

  bodyKey: MessageKey;

  ctaKey: MessageKey;

  route: string;

  missionId?: string;
};

export type EarnHubSeasonSnapshot = {
  id: number;

  percent: number;

  daysLeft: number;
};

export type EarnHubWalletSnapshot = {
  phonBalanceLabel: string;

  discountTickets: number;

  freeTradeTickets: number;
};

export type EarnHubCooldownSnapshot = {
  active: boolean;

  reasonKey: MessageKey | null;
};

export type EarnHubLaunchSlotsSnapshot = {
  filled: number;

  total: number;
};

export function resolveEarnHomeProofModeFromEnv(
  env: Record<string, string | undefined> = import.meta.env,
): EarnHomeProofMode {
  const raw = env[EARN_HOME_PROOF_ENV_KEY]?.trim().toLowerCase();

  return raw === 'live' ? 'live' : 'ambient';
}

export function isEarnHomeCanonicalRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  return normalized === EARN_HOME_CANONICAL_ROUTE;
}

/** L2 — catalog `reward_phon` sum (never 0 when LIVE missions exist). */

export function sumEarnHomeCatalogRewardsPhon(): number {
  return EARN_STATIC_MISSIONS.filter(
    (mission) => !mission.soon && !shouldDeferMissionRow(mission.id),
  ).reduce((total, mission) => total + parseLandingRewardPhon(mission.rewardLabel), 0);
}

export function formatEarnHomeCatalogRewardsLabel(amount: number): string {
  return `+${formatLandingPhonAmount(amount)}P`;
}

export function parseEarnHubSeasonSnapshot(
  payload: Record<string, unknown> | null | undefined,
): EarnHubSeasonSnapshot | null {
  const season = payload?.['season'];

  if (!season || typeof season !== 'object') return null;

  const row = season as Record<string, unknown>;

  return {
    id: Number(row['id'] ?? 1),

    percent: Number(row['percent'] ?? 0),

    daysLeft: Number(row['days_left'] ?? 0),
  };
}

export function parseEarnHubWalletSnapshot(
  payload: Record<string, unknown> | null | undefined,
): EarnHubWalletSnapshot | null {
  const wallet = payload?.['wallet'];

  if (!wallet || typeof wallet !== 'object') return null;

  const row = wallet as Record<string, unknown>;

  const phon = String(row['phon_balance'] ?? '0');

  const discountRaw = Number(row['discount_tickets'] ?? 0);
  const freeTradeRaw = Number(row['free_trade_tickets'] ?? 0);

  return {
    phonBalanceLabel: formatPhonRewardDisplay(phon),
    discountTickets: Number.isFinite(discountRaw) && discountRaw >= 0 ? discountRaw : 0,
    freeTradeTickets: Number.isFinite(freeTradeRaw) && freeTradeRaw >= 0 ? freeTradeRaw : 0,
  };
}

export function resolveEarnHomeRewardTicketsIssuanceNoteKey() {
  return resolveRewardTicketsIssuanceNoteKey();
}

export function shouldEarnHomeShowRewardTicketsIssuanceNote(): boolean {
  return shouldShowRewardTicketsIssuanceNote();
}

export function parseEarnHubCooldownSnapshot(
  payload: Record<string, unknown> | null | undefined,
): EarnHubCooldownSnapshot {
  const cooldown = payload?.['cooldown'];

  if (!cooldown || typeof cooldown !== 'object') {
    return { active: false, reasonKey: null };
  }

  const row = cooldown as Record<string, unknown>;

  const reasonRaw = row['reason_key'];

  return {
    active: Boolean(row['active']),

    reasonKey:
      typeof reasonRaw === 'string' && reasonRaw.length > 0 ? (reasonRaw as MessageKey) : null,
  };
}

export function parseEarnHubLaunchSlotsSnapshot(
  payload: Record<string, unknown> | null | undefined,
): EarnHubLaunchSlotsSnapshot | null {
  const slots = payload?.['launch_slots'];

  if (!slots || typeof slots !== 'object') return null;

  const row = slots as Record<string, unknown>;

  return {
    filled: Number(row['filled'] ?? 0),

    total: Number(row['total'] ?? 0),
  };
}

export function buildEarnHomeTierProgress(
  payload: Record<string, unknown> | null | undefined,
): TierProgressView | null {
  const snapshot = parseEarnHubTierSnapshot(payload);

  if (!snapshot) return null;

  return buildTierProgressView(snapshot);
}

export function resolveEarnHomeNextAction(params: {
  attendanceRemaining: number;

  rouletteRemaining: number;

  claimableMissionId: string | null;

  claimableMissionTitleKey: MessageKey | null;
}): EarnHomeNextActionView {
  if (params.attendanceRemaining > 0) {
    return {
      kind: 'attendance',

      titleKey: 'earn.home.todayOpportunity.attendance',

      bodyKey: 'earn.attendance.head.desc',

      ctaKey: 'earn.attendance.cta',

      route: HOME_ATTENDANCE_ROUTE,
    };
  }

  if (params.claimableMissionId && params.claimableMissionTitleKey) {
    return {
      kind: 'mission_claim',

      titleKey: params.claimableMissionTitleKey,

      bodyKey: 'earn.home.entry.missions.body',

      ctaKey: 'common.cta.claim',

      route: HOME_MISSIONS_ROUTE,

      missionId: params.claimableMissionId,
    };
  }

  if (params.rouletteRemaining > 0) {
    return {
      kind: 'roulette',

      titleKey: 'earn.home.todayOpportunity.events',

      bodyKey: 'earn.home.entry.events.body',

      ctaKey: 'earn.home.entry.events.cta',

      route: HOME_ATTENDANCE_ROUTE,
    };
  }

  return {
    kind: 'missions',

    titleKey: 'earn.home.entry.missions.title',

    bodyKey: 'earn.home.entry.missions.body',

    ctaKey: 'earn.home.entry.missions.cta',

    route: HOME_MISSIONS_ROUTE,
  };
}
