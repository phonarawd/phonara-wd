/**
 * P10 Sports rules + VIP stub — `/sports/rules` · `/sports/vip` (§20.13.3 Sports#4).
 * Rules = i18n/CMS ui_only · VIP markets = ENGINE:gap until E4 Option B · E5 wire.
 * Existing routes/surface only — parallel page 0 · no client money math.
 */

import type { MessageKey } from '@phonara/i18n';

import {
  SPORTS_VIP_DEFER_REASON_KEY,
  SPORTS_VIP_ENGINE_TODO,
  SPORTS_VIP_ROUTE,
  SPORTS_VIP_UI_UNLOCK_TODO,
} from './dead-controls-display-contract';
import { SPORTS_RULES_ROUTE, SPORTS_VIP_ROUTE_HUB } from './sports-hub-pages-display-contract';
import { P10_SPORTS_LAYOUT_DEDUP_TODO } from './sports-exchange-parity-display-contract';

export const P10_SPORTS_RULES_AND_VIP_TODO = 'p10-sports-rules-and-vip-stub' as const;

export const P10_SPORTS_RULES_AND_VIP_PREREQUISITE_TODOS = [P10_SPORTS_LAYOUT_DEDUP_TODO] as const;

/** Canonical rules route — hub-registered · no parallel `/betting/rules` page. */
export const SPORTS_RULES_SURFACE_ROUTE = SPORTS_RULES_ROUTE;

/** Canonical VIP stub route — same path as dead-controls registry. */
export const SPORTS_VIP_STUB_ROUTE = SPORTS_VIP_ROUTE_HUB;

export const SPORTS_RULES_ROUTE_OWNER = 'sports.rules.tsx' as const;
export const SPORTS_VIP_ROUTE_OWNER = 'sports.vip.tsx' as const;
export const SPORTS_RULES_VIP_PAGE_OWNER = 'sports-page.tsx' as const;

export const SPORTS_RULES_AND_VIP_ROUTE_OWNERS = [
  SPORTS_RULES_ROUTE_OWNER,
  SPORTS_VIP_ROUTE_OWNER,
] as const;

export const SPORTS_RULES_AND_VIP_SURFACE_OWNERS = [
  SPORTS_RULES_VIP_PAGE_OWNER,
  'sports-rules-panel.tsx',
  'sports-vip-stub-panel.tsx',
] as const;

export type SportsRulesVipEngineStatus = 'ui_only' | 'gap' | 'exists';
export type SportsRulesVipExposureMode = 'live' | 'defer_stub' | 'built_hidden';

/** Min Earn VIP tier for VIP room copy — display-only until E4 enforces caps. */
export const SPORTS_VIP_MIN_TIER = 'platinum' as const;

export const SPORTS_RULES_ENGINE_STATUS = 'ui_only' as const satisfies SportsRulesVipEngineStatus;
export const SPORTS_VIP_MARKETS_ENGINE_STATUS = 'gap' as const satisfies SportsRulesVipEngineStatus;

export const SPORTS_RULES_PAGE_EXPOSURE = 'live' as const satisfies SportsRulesVipExposureMode;
export const SPORTS_VIP_PAGE_EXPOSURE = 'defer_stub' as const satisfies SportsRulesVipExposureMode;

export const SPORTS_RULES_SEO_TITLE_KEY = 'seo.sports.rules.title' as const satisfies MessageKey;
export const SPORTS_VIP_SEO_TITLE_KEY = 'seo.sports.vip.title' as const satisfies MessageKey;

export const SPORTS_RULES_INTRO_KEY = 'sports.rules.intro' as const satisfies MessageKey;

export const SPORTS_RULES_SECTION_KEYS = [
  'sports.rules.odds.title',
  'sports.rules.odds.body',
  'sports.rules.settlement.title',
  'sports.rules.settlement.body',
  'sports.rules.void.title',
  'sports.rules.void.body',
  'sports.rules.live.title',
  'sports.rules.live.body',
  'sports.rules.responsible.title',
  'sports.rules.responsible.body',
] as const satisfies readonly MessageKey[];

export type SportsRulesSectionId = 'odds' | 'settlement' | 'void' | 'live' | 'responsible';

export type SportsRulesSection = {
  readonly id: SportsRulesSectionId;
  readonly titleKey: MessageKey;
  readonly bodyKey: MessageKey;
};

export const SPORTS_RULES_SECTIONS: readonly SportsRulesSection[] = [
  {
    id: 'odds',
    titleKey: 'sports.rules.odds.title',
    bodyKey: 'sports.rules.odds.body',
  },
  {
    id: 'settlement',
    titleKey: 'sports.rules.settlement.title',
    bodyKey: 'sports.rules.settlement.body',
  },
  {
    id: 'void',
    titleKey: 'sports.rules.void.title',
    bodyKey: 'sports.rules.void.body',
  },
  {
    id: 'live',
    titleKey: 'sports.rules.live.title',
    bodyKey: 'sports.rules.live.body',
  },
  {
    id: 'responsible',
    titleKey: 'sports.rules.responsible.title',
    bodyKey: 'sports.rules.responsible.body',
  },
] as const;

export const SPORTS_VIP_ELIGIBILITY_TITLE_KEY =
  'sports.vip.eligibility.title' as const satisfies MessageKey;
export const SPORTS_VIP_ELIGIBILITY_BODY_KEY =
  'sports.vip.eligibility.body' as const satisfies MessageKey;
export const SPORTS_VIP_ELIGIBILITY_TIER_KEY =
  'sports.vip.eligibility.tier' as const satisfies MessageKey;

export const SPORTS_VIP_DEFER_TITLE_KEY = 'sports.vip.defer.title' as const satisfies MessageKey;
export const SPORTS_VIP_STUB_REASON_KEY = SPORTS_VIP_DEFER_REASON_KEY;

export const SPORTS_VIP_ENGINE_GATE_TODO = SPORTS_VIP_ENGINE_TODO;
export const SPORTS_VIP_LIVE_UNLOCK_TODO = SPORTS_VIP_UI_UNLOCK_TODO;

export const SPORTS_RULES_RESPONSIBLE_HREF = '/legal/responsible-gaming' as const;

export function resolveSportsRulesRoute(): typeof SPORTS_RULES_SURFACE_ROUTE {
  return SPORTS_RULES_SURFACE_ROUTE;
}

export function resolveSportsVipStubRoute(): typeof SPORTS_VIP_STUB_ROUTE {
  return SPORTS_VIP_STUB_ROUTE;
}

export function resolveSportsRulesPageExposure(): typeof SPORTS_RULES_PAGE_EXPOSURE {
  return SPORTS_RULES_PAGE_EXPOSURE;
}

export function resolveSportsVipPageExposure(): typeof SPORTS_VIP_PAGE_EXPOSURE {
  return SPORTS_VIP_PAGE_EXPOSURE;
}

/** VIP markets stay stub until E4 engine + E5 wire — never fake live odds. */
export function canBrowseSportsVipMarkets(): boolean {
  return false;
}

export function resolveSportsVipMinTierLabelKey(): typeof SPORTS_VIP_ELIGIBILITY_TIER_KEY {
  return SPORTS_VIP_ELIGIBILITY_TIER_KEY;
}

export function assertSportsRulesAndVipDisplayContractSync(): void {
  if (P10_SPORTS_RULES_AND_VIP_TODO !== 'p10-sports-rules-and-vip-stub') {
    throw new Error('sports-rules-vip: owner todo id drift');
  }
  if (!P10_SPORTS_RULES_AND_VIP_PREREQUISITE_TODOS.includes(P10_SPORTS_LAYOUT_DEDUP_TODO)) {
    throw new Error('sports-rules-vip: layout-dedup prerequisite missing');
  }
  if (SPORTS_RULES_SURFACE_ROUTE !== '/sports/rules') {
    throw new Error('sports-rules-vip: rules route drift');
  }
  if (SPORTS_VIP_STUB_ROUTE !== '/sports/vip' || SPORTS_VIP_ROUTE !== '/sports/vip') {
    throw new Error('sports-rules-vip: vip route drift');
  }
  if (SPORTS_VIP_MIN_TIER !== 'platinum') {
    throw new Error('sports-rules-vip: min tier must stay platinum until E4');
  }
  if (SPORTS_RULES_SECTIONS.length !== 5) {
    throw new Error('sports-rules-vip: expected 5 rules sections');
  }
  if (canBrowseSportsVipMarkets()) {
    throw new Error('sports-rules-vip: VIP markets must stay closed until E5');
  }
  if (SPORTS_VIP_LIVE_UNLOCK_TODO !== 'ew-e5-gap-surfaces-wire') {
    throw new Error('sports-rules-vip: UI unlock todo must be ew-e5-gap-surfaces-wire');
  }
  if (SPORTS_VIP_ENGINE_GATE_TODO !== 'ew-e4-gate-tier-option-b') {
    throw new Error('sports-rules-vip: engine gate todo drift');
  }
}
