/**
 * `/events` — Golden Earth primary tap hub + season link cards (P11).
 * Money: `rpc_get_golden_earth_status` read + `rpc_golden_earth_tap` only — no client reward math.
 * Season CMS cards = defer_stub (static i18n OK until engine).
 */

import type { MessageKey } from '@phonara/i18n';

import {
  GOLDEN_EARTH_PRIMARY_TAP_ROUTE,
  GOLDEN_EARTH_STATUS_RPC,
  GOLDEN_EARTH_TAP_RPC,
  resolveGoldenEarthTapBlocked,
  shouldDeferEventsSeasonCards,
} from './golden-earth-display-contract';
import { HOME_ATTENDANCE_ROUTE } from './home-attendance-display-contract';
import { HOME_MISSIONS_ROUTE } from './home-missions-display-contract';
import { EARN_PLAY_ROUTE } from './earn-play-display-contract';

export const EVENTS_HUB_ROUTE = GOLDEN_EARTH_PRIMARY_TAP_ROUTE;
export const EVENTS_HUB_STATUS_RPC = GOLDEN_EARTH_STATUS_RPC;
export const EVENTS_HUB_TAP_RPC = GOLDEN_EARTH_TAP_RPC;

export const EVENTS_HUB_SEO_TITLE_KEY = 'events.page.title' as const satisfies MessageKey;
export const EVENTS_HUB_SEO_DESCRIPTION_KEY = 'events.page.subtitle' as const satisfies MessageKey;

export type GoldenEarthStatusSnapshot = {
  authenticated: boolean;
  globalTotal: number;
  globalUntilJackpot: number;
  tapCount: number;
  dailyCap: number;
  remaining: number;
  earnedPhonToday: string;
  maxPhonTodayEstimate: string;
  goldenHourActive: boolean;
  goldenHourMinutesLeft: number | null;
  tier: string | null;
  systemHalted: boolean;
};

export type GoldenEarthTapResult = {
  ok: boolean;
  duplicate: boolean;
  phonAwarded: string;
  remaining: number;
  dailyCap: number;
  isJackpot: boolean;
  isGlobalJackpot: boolean;
  tierUpgraded: boolean;
  goldenHourActive: boolean;
};

export type EventsSeasonCardId = 'attendance' | 'missions' | 'roulette';

export type EventsSeasonCardDefinition = {
  id: EventsSeasonCardId;
  titleKey: MessageKey;
  bodyKey: MessageKey;
  route: string;
};

/** Static season cards — engine missing · presentation links only. */
export const EVENTS_SEASON_CARDS: readonly EventsSeasonCardDefinition[] = [
  {
    id: 'attendance',
    titleKey: 'events.card.attendance.title',
    bodyKey: 'events.card.attendance.body',
    route: HOME_ATTENDANCE_ROUTE,
  },
  {
    id: 'missions',
    titleKey: 'events.card.missions.title',
    bodyKey: 'events.card.missions.body',
    route: HOME_MISSIONS_ROUTE,
  },
  {
    id: 'roulette',
    titleKey: 'events.card.roulette.title',
    bodyKey: 'events.card.roulette.body',
    route: EARN_PLAY_ROUTE,
  },
] as const;

export function parseGoldenEarthStatusSnapshot(
  payload: Record<string, unknown> | null | undefined,
): GoldenEarthStatusSnapshot | null {
  if (!payload || payload['ok'] === false) return null;

  return {
    authenticated: Boolean(payload['authenticated']),
    globalTotal: Number(payload['global_total'] ?? 0),
    globalUntilJackpot: Number(payload['global_until_jackpot'] ?? 0),
    tapCount: Number(payload['tap_count'] ?? 0),
    dailyCap: Number(payload['daily_cap'] ?? 0),
    remaining: Number(payload['remaining'] ?? 0),
    earnedPhonToday: String(payload['earned_phon_today'] ?? '0'),
    maxPhonTodayEstimate: String(payload['max_phon_today_estimate'] ?? '0'),
    goldenHourActive: Boolean(payload['golden_hour_active']),
    goldenHourMinutesLeft:
      payload['golden_hour_minutes_left'] != null
        ? Number(payload['golden_hour_minutes_left'])
        : null,
    tier: payload['tier'] != null ? String(payload['tier']) : null,
    systemHalted: Boolean(payload['system_halted']),
  };
}

export function parseGoldenEarthTapResult(
  payload: Record<string, unknown> | null | undefined,
): GoldenEarthTapResult | null {
  if (!payload) return null;
  return {
    ok: Boolean(payload['ok'] ?? true),
    duplicate: Boolean(payload['duplicate']),
    phonAwarded: String(payload['phon_awarded'] ?? '0'),
    remaining: Number(payload['remaining'] ?? 0),
    dailyCap: Number(payload['daily_cap'] ?? 0),
    isJackpot: Boolean(payload['is_jackpot']),
    isGlobalJackpot: Boolean(payload['is_global_jackpot']),
    tierUpgraded: Boolean(payload['tier_upgraded']),
    goldenHourActive: Boolean(payload['golden_hour_active']),
  };
}

export function resolveEventsTapBlocked(params: {
  authenticated: boolean;
  systemHalted: boolean;
  remaining: number;
}): boolean {
  return resolveGoldenEarthTapBlocked(params);
}

export function listEventsSeasonCards(): readonly EventsSeasonCardDefinition[] {
  // Engine missing — still show static i18n cards (defer_stub exposure).
  void shouldDeferEventsSeasonCards();
  return EVENTS_SEASON_CARDS;
}
