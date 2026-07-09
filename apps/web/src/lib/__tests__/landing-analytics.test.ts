import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resetLandingAnalyticsForTests,
  trackLandingEvent,
  trackLandingEventFromElement,
  trackLandingSignupCompleted,
} from '../landing-analytics';

describe('landing-analytics', () => {
  beforeEach(() => {
    resetLandingAnalyticsForTests();
    vi.stubGlobal('phonaraTrackLanding', vi.fn());
  });

  it('invokes production hook on track', () => {
    trackLandingEvent('landing.hero.cta');
    expect(window.phonaraTrackLanding).toHaveBeenCalledWith('landing.hero.cta', undefined);
  });

  it('dedupes once-per-session view events', () => {
    trackLandingEvent('landing.hero.viewed');
    trackLandingEvent('landing.hero.viewed');
    expect(window.phonaraTrackLanding).toHaveBeenCalledTimes(1);
  });

  it('reads event from clicked element', () => {
    const button = document.createElement('button');
    button.setAttribute('data-analytics-event', 'landing.mission.click');
    document.body.appendChild(button);

    trackLandingEventFromElement(button);
    expect(window.phonaraTrackLanding).toHaveBeenCalledWith('landing.mission.click', undefined);

    document.body.removeChild(button);
  });

  it('parses FAQ expand payload from element', () => {
    const button = document.createElement('button');
    button.setAttribute('data-analytics-event', 'landing.faq.expand');
    button.setAttribute('data-analytics-payload', JSON.stringify({ id: 'canGetPaid' }));
    document.body.appendChild(button);

    trackLandingEventFromElement(button);
    expect(window.phonaraTrackLanding).toHaveBeenCalledWith('landing.faq.expand', {
      id: 'canGetPaid',
    });

    document.body.removeChild(button);
  });

  it('tracks signup completed for auth handoff', () => {
    trackLandingSignupCompleted();
    expect(window.phonaraTrackLanding).toHaveBeenCalledWith('landing.signup.completed', undefined);
  });
});
