import { describe, expect, it } from 'vitest';

import {
  earnSurfaceRouteMatcher,
  resolveBottomNavTab,
  resolveMarketingShellVariant,
  shouldMountAppShell,
  shouldMountMarketingShell,
  tradeSurfaceRouteMatcher,
} from '../shell-route-matchers';

describe('shell-route-matchers', () => {
  it('matches §12.19.4 earn surface routes', () => {
    expect(earnSurfaceRouteMatcher('/home')).toBe(true);
    expect(earnSurfaceRouteMatcher('/home/missions')).toBe(true);
    expect(earnSurfaceRouteMatcher('/referral/invite')).toBe(true);
    expect(earnSurfaceRouteMatcher('/tier/me')).toBe(true);
    expect(earnSurfaceRouteMatcher('/earn/cashback')).toBe(true);
    expect(earnSurfaceRouteMatcher('/share/earnings')).toBe(true);
    expect(earnSurfaceRouteMatcher('/staking')).toBe(true);
    expect(earnSurfaceRouteMatcher('/trade')).toBe(false);
  });

  it('resolves BottomNav Tab1 earn for earn routes', () => {
    expect(resolveBottomNavTab('/home')).toBe('earn');
    expect(resolveBottomNavTab('/home/missions')).toBe('earn');
    expect(resolveBottomNavTab('/wallet')).toBe('wallet');
    expect(resolveBottomNavTab('/trade/futures')).toBe('trade');
    expect(resolveBottomNavTab('/sports/live')).toBe('sports');
    expect(resolveBottomNavTab('/casino')).toBe('casino');
    expect(resolveBottomNavTab('/games/plinko')).toBe('casino');
  });

  it('mounts AppShell on in-app routes only', () => {
    expect(shouldMountAppShell('/')).toBe(false);
    expect(shouldMountAppShell('/login')).toBe(false);
    expect(shouldMountAppShell('/signup')).toBe(false);
    expect(shouldMountAppShell('/reset-password')).toBe(false);
    expect(shouldMountAppShell('/verify-email')).toBe(false);
    expect(shouldMountAppShell('/auth/callback')).toBe(false);
    expect(shouldMountAppShell('/legal/terms')).toBe(false);
    expect(shouldMountAppShell('/home')).toBe(true);
    expect(shouldMountAppShell('/wallet/deposit')).toBe(true);
    expect(shouldMountAppShell('/account')).toBe(true);
    expect(shouldMountAppShell('/settings/security')).toBe(true);
    expect(shouldMountAppShell('/install')).toBe(true);
    expect(shouldMountAppShell('/onboarding')).toBe(true);
    expect(shouldMountAppShell('/onboarding/missions')).toBe(true);
  });

  it('mounts MarketingShell on landing and auth funnel only', () => {
    expect(shouldMountMarketingShell('/')).toBe(true);
    expect(shouldMountMarketingShell('/login')).toBe(true);
    expect(shouldMountMarketingShell('/signup')).toBe(true);
    expect(shouldMountMarketingShell('/reset-password')).toBe(true);
    expect(shouldMountMarketingShell('/verify-email')).toBe(true);
    expect(shouldMountMarketingShell('/auth/callback')).toBe(true);
    expect(shouldMountMarketingShell('/home')).toBe(false);
    expect(shouldMountMarketingShell('/legal/terms')).toBe(false);
  });

  it('resolves marketing shell variants for landing vs auth', () => {
    expect(resolveMarketingShellVariant('/')).toBe('landing');
    expect(resolveMarketingShellVariant('/login')).toBe('auth');
    expect(resolveMarketingShellVariant('/signup')).toBe('auth');
  });

  it('isolates trade surface from sports/casino', () => {
    expect(tradeSurfaceRouteMatcher('/trade')).toBe(true);
    expect(tradeSurfaceRouteMatcher('/sports')).toBe(false);
    expect(tradeSurfaceRouteMatcher('/casino')).toBe(false);
  });
});
