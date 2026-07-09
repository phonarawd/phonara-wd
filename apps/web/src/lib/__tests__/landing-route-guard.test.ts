import { describe, expect, it } from 'vitest';

import { resolveLandingRouteRedirect } from '@/lib/landing-route-guard';

describe('resolveLandingRouteRedirect', () => {
  it('allows QA escape via ?landing=1 even with session or marker', () => {
    expect(
      resolveLandingRouteRedirect({
        search: '?landing=1',
        hasSession: true,
        hasAccount: true,
      }),
    ).toBeNull();
  });

  it('redirects authenticated users to /home', () => {
    expect(
      resolveLandingRouteRedirect({
        search: '',
        hasSession: true,
        hasAccount: false,
      }),
    ).toBe('/home');
  });

  it('redirects returning devices with account marker to /login', () => {
    expect(
      resolveLandingRouteRedirect({
        search: '',
        hasSession: false,
        hasAccount: true,
      }),
    ).toBe('/login');
  });

  it('shows landing for fresh ad traffic', () => {
    expect(
      resolveLandingRouteRedirect({
        search: '?utm_source=tiktok',
        hasSession: false,
        hasAccount: false,
      }),
    ).toBeNull();
  });
});
