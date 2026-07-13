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
    expect(earnSurfaceRouteMatcher('/onboarding')).toBe(true);
    expect(earnSurfaceRouteMatcher('/onboarding/missions')).toBe(true);
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

  it('mounts MarketingShell on landing, auth, and P12 public trust routes', () => {
    expect(shouldMountMarketingShell('/')).toBe(true);
    expect(shouldMountMarketingShell('/login')).toBe(true);
    expect(shouldMountMarketingShell('/signup')).toBe(true);
    expect(shouldMountMarketingShell('/reset-password')).toBe(true);
    expect(shouldMountMarketingShell('/verify-email')).toBe(true);
    expect(shouldMountMarketingShell('/auth/callback')).toBe(true);
    expect(shouldMountMarketingShell('/tier')).toBe(true);
    expect(shouldMountMarketingShell('/features')).toBe(true);
    expect(shouldMountMarketingShell('/features/earn')).toBe(true);
    expect(shouldMountMarketingShell('/fees')).toBe(true);
    expect(shouldMountMarketingShell('/security')).toBe(true);
    expect(shouldMountMarketingShell('/announcements')).toBe(true);
    expect(shouldMountMarketingShell('/status')).toBe(true);
    expect(shouldMountMarketingShell('/support')).toBe(true);
    expect(shouldMountMarketingShell('/support/faq')).toBe(true);
    expect(shouldMountMarketingShell('/support/ticket')).toBe(true);
    expect(shouldMountMarketingShell('/feedback')).toBe(true);
    expect(shouldMountMarketingShell('/home')).toBe(false);
    expect(shouldMountMarketingShell('/legal/terms')).toBe(false);
    expect(shouldMountMarketingShell('/tier/me')).toBe(false);
  });

  it('keeps exact /tier off Earn AppShell while /tier/me stays Earn', () => {
    expect(earnSurfaceRouteMatcher('/tier')).toBe(false);
    expect(earnSurfaceRouteMatcher('/tier/me')).toBe(true);
    expect(shouldMountAppShell('/tier')).toBe(false);
    expect(shouldMountAppShell('/tier/me')).toBe(true);
    expect(shouldMountAppShell('/features')).toBe(false);
    expect(shouldMountAppShell('/security')).toBe(false);
    expect(shouldMountAppShell('/support')).toBe(false);
    expect(shouldMountAppShell('/feedback')).toBe(false);
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
