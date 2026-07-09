import { describe, expect, it } from 'vitest';

import {
  isLandingAnalyticsEvent,
  LANDING_ANALYTICS_EVENTS,
  LANDING_ANALYTICS_NORTH_STAR_MAP,
  LANDING_ANALYTICS_ONCE_EVENTS,
  LANDING_ANALYTICS_SCROLL_DEPTHS,
  landingAnalyticsEventAttr,
  landingAnalyticsEventWithPayload,
  landingScrollDepthEvent,
  parseLandingAnalyticsPayload,
} from '../landing-analytics-display-contract';

describe('landing-analytics-display-contract', () => {
  it('defines mandatory funnel events per SUCCESS_METRICS §2', () => {
    expect(LANDING_ANALYTICS_EVENTS).toEqual([
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
    ]);
  });

  it('maps scroll depth milestones to event names', () => {
    expect(LANDING_ANALYTICS_SCROLL_DEPTHS).toEqual([25, 50, 75]);
    expect(landingScrollDepthEvent(50)).toBe('landing.scroll.50');
  });

  it('marks view and scroll events as once-per-session', () => {
    expect(LANDING_ANALYTICS_ONCE_EVENTS.has('landing.hero.viewed')).toBe(true);
    expect(LANDING_ANALYTICS_ONCE_EVENTS.has('landing.hero.cta')).toBe(false);
    expect(LANDING_ANALYTICS_ONCE_EVENTS.has('landing.faq.expand')).toBe(false);
  });

  it('maps signup funnel events to North Star signup metric', () => {
    expect(LANDING_ANALYTICS_NORTH_STAR_MAP['landing.signup.completed']).toBe('signup');
    expect(LANDING_ANALYTICS_NORTH_STAR_MAP['landing.hero.cta']).toBe('signup');
  });

  it('builds data-analytics attribute helpers', () => {
    expect(landingAnalyticsEventAttr('landing.hero.cta')).toEqual({
      'data-analytics-event': 'landing.hero.cta',
    });
    expect(landingAnalyticsEventWithPayload('landing.faq.expand', { id: 'canGetPaid' })).toEqual({
      'data-analytics-event': 'landing.faq.expand',
      'data-analytics-payload': JSON.stringify({ id: 'canGetPaid' }),
    });
  });

  it('parses FAQ expand payload from DOM JSON', () => {
    expect(parseLandingAnalyticsPayload(JSON.stringify({ id: 'timeNeeded' }))).toEqual({
      id: 'timeNeeded',
    });
    expect(parseLandingAnalyticsPayload('not-json')).toBeUndefined();
  });

  it('validates event names', () => {
    expect(isLandingAnalyticsEvent('landing.hero.viewed')).toBe(true);
    expect(isLandingAnalyticsEvent('landing.unknown')).toBe(false);
  });
});
