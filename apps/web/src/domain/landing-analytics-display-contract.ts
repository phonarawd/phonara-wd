/**
 * Landing funnel analytics — Phase 1 contract (ADR-003 §6 · SUCCESS_METRICS §2).
 * UI emits `data-analytics-*` attributes; runtime binds via `landing-analytics.ts`.
 */

import type { LandingFaqId } from '@/domain/landing-display-contract';

export const LANDING_ANALYTICS_ENGINE_STATUS = 'ui_only' as const;

/** DOM attribute — event name (required on interactive + view targets). */
export const LANDING_ANALYTICS_ATTR_EVENT = 'data-analytics-event' as const;

/** DOM attribute — optional JSON payload (FAQ expand id, etc.). */
export const LANDING_ANALYTICS_ATTR_PAYLOAD = 'data-analytics-payload' as const;

/** Scroll depth milestones — fire once each per page load. */
export const LANDING_ANALYTICS_SCROLL_DEPTHS = [25, 50, 75] as const;

export type LandingAnalyticsScrollDepth = (typeof LANDING_ANALYTICS_SCROLL_DEPTHS)[number];

export const LANDING_ANALYTICS_EVENTS = [
  'landing.hero.viewed',
  'landing.hero.cta',
  'landing.scroll.25',
  'landing.scroll.50',
  'landing.scroll.75',
  'landing.mission.viewed',
  'landing.mission.click',
  'landing.wallet.viewed',
  'landing.withdraw.viewed',
  'landing.faq.viewed',
  'landing.faq.expand',
  'landing.signup.started',
  'landing.signup.completed',
  'landing.finalCta.click',
] as const;

export type LandingAnalyticsEvent = (typeof LANDING_ANALYTICS_EVENTS)[number];

export type LandingAnalyticsFaqExpandPayload = {
  readonly id: LandingFaqId;
};

export type LandingAnalyticsPayload = LandingAnalyticsFaqExpandPayload | Record<string, string>;

/** Events that must only fire once per landing page session. */
export const LANDING_ANALYTICS_ONCE_EVENTS: ReadonlySet<LandingAnalyticsEvent> = new Set([
  'landing.hero.viewed',
  'landing.scroll.25',
  'landing.scroll.50',
  'landing.scroll.75',
  'landing.mission.viewed',
  'landing.wallet.viewed',
  'landing.withdraw.viewed',
  'landing.faq.viewed',
]);

/** North Star mapping — analytics event → product metric (SUCCESS_METRICS §1). */
export const LANDING_ANALYTICS_NORTH_STAR_MAP: Readonly<
  Partial<
    Record<LandingAnalyticsEvent, 'signup' | 'activation' | 'first_earn' | 'first_withdraw' | 'd7'>
  >
> = {
  'landing.hero.cta': 'signup',
  'landing.mission.click': 'signup',
  'landing.signup.started': 'signup',
  'landing.signup.completed': 'signup',
  'landing.finalCta.click': 'signup',
};

export function landingScrollDepthEvent(
  depth: LandingAnalyticsScrollDepth,
): `landing.scroll.${LandingAnalyticsScrollDepth}` {
  return `landing.scroll.${depth}`;
}

export function isLandingAnalyticsEvent(value: string): value is LandingAnalyticsEvent {
  return (LANDING_ANALYTICS_EVENTS as readonly string[]).includes(value);
}

export function parseLandingAnalyticsPayload(
  raw: string | null | undefined,
): LandingAnalyticsPayload | undefined {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as LandingAnalyticsPayload;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function landingAnalyticsEventAttr(event: LandingAnalyticsEvent): Record<string, string> {
  return { [LANDING_ANALYTICS_ATTR_EVENT]: event };
}

export function landingAnalyticsEventWithPayload(
  event: LandingAnalyticsEvent,
  payload: LandingAnalyticsPayload,
): Record<string, string> {
  return {
    [LANDING_ANALYTICS_ATTR_EVENT]: event,
    [LANDING_ANALYTICS_ATTR_PAYLOAD]: JSON.stringify(payload),
  };
}
