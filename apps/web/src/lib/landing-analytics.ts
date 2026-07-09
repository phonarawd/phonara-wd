import {
  isLandingAnalyticsEvent,
  LANDING_ANALYTICS_ONCE_EVENTS,
  parseLandingAnalyticsPayload,
  type LandingAnalyticsEvent,
  type LandingAnalyticsPayload,
} from '@/domain/landing-analytics-display-contract';

declare global {
  interface Window {
    /** Production pixel / analytics hook — set by operator tag manager. */
    phonaraTrackLanding?: (event: LandingAnalyticsEvent, payload?: LandingAnalyticsPayload) => void;
  }
}

const firedOnceKeys = new Set<string>();

function onceKey(event: LandingAnalyticsEvent, payload?: LandingAnalyticsPayload): string {
  return payload ? `${event}:${JSON.stringify(payload)}` : event;
}

/** Test-only reset — vitest isolation. */
export function resetLandingAnalyticsForTests(): void {
  firedOnceKeys.clear();
}

export function trackLandingEvent(
  event: LandingAnalyticsEvent,
  payload?: LandingAnalyticsPayload,
): void {
  if (typeof window === 'undefined') return;

  const key = onceKey(event, payload);
  if (LANDING_ANALYTICS_ONCE_EVENTS.has(event) && firedOnceKeys.has(key)) return;
  if (LANDING_ANALYTICS_ONCE_EVENTS.has(event)) firedOnceKeys.add(key);

  if (import.meta.env.DEV) {
    // release-allow: landing funnel DEV stub for operator preview
    console.debug('[landing-analytics]', event, payload ?? {});
  }

  window.phonaraTrackLanding?.(event, payload);
}

export function trackLandingEventFromElement(target: EventTarget | null): void {
  if (!(target instanceof Element)) return;

  const el = target.closest('[data-analytics-event]');
  if (!(el instanceof HTMLElement)) return;

  const eventName = el.getAttribute('data-analytics-event');
  if (!eventName || !isLandingAnalyticsEvent(eventName)) return;

  const payload = parseLandingAnalyticsPayload(el.getAttribute('data-analytics-payload'));
  trackLandingEvent(eventName, payload);
}

/** Post-auth signup conversion — auth surface calls after session established. */
export function trackLandingSignupCompleted(): void {
  trackLandingEvent('landing.signup.completed');
}
