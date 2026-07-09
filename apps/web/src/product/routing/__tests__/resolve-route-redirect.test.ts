import { describe, expect, it } from 'vitest';

import {
  formatRedirectHref,
  isForbiddenTradeSectionSearch,
  isRedirectOnlyPath,
  resolveRouteRedirect,
} from '../resolve-route-redirect';

describe('resolveRouteRedirect', () => {
  it('redirects legacy /trade ?section=sports|casino|bet to canonical surfaces', () => {
    expect(resolveRouteRedirect('/trade', '?section=sports')).toEqual({ pathname: '/sports' });
    expect(resolveRouteRedirect('/trade', '?section=casino')).toEqual({ pathname: '/casino' });
    expect(resolveRouteRedirect('/trade', '?section=bet')).toEqual({ pathname: '/sports' });
  });

  it('strips legacy ?section=trade on /trade', () => {
    expect(resolveRouteRedirect('/trade', '?section=trade')).toEqual({ pathname: '/trade' });
    expect(resolveRouteRedirect('/trade', { section: 'trade', foo: 'bar' })).toEqual({
      pathname: '/trade',
      search: { foo: 'bar' },
    });
  });

  it('preserves unrelated search params when stripping forbidden trade sections', () => {
    expect(resolveRouteRedirect('/trade', '?section=sports&utm=1')).toEqual({
      pathname: '/sports',
      search: { utm: '1' },
    });
  });

  it('does not redirect canonical /trade without legacy section', () => {
    expect(resolveRouteRedirect('/trade')).toBeNull();
    expect(resolveRouteRedirect('/trade', '?pair=BTC-PHON')).toBeNull();
  });

  it('maps §12.17 earn and dashboard aliases to /home', () => {
    expect(resolveRouteRedirect('/earn')).toEqual({ pathname: '/home' });
    expect(resolveRouteRedirect('/dashboard')).toEqual({ pathname: '/home' });
  });

  it('maps deposit and withdraw top-level paths into wallet hubs', () => {
    expect(resolveRouteRedirect('/deposit')).toEqual({ pathname: '/wallet/deposit' });
    expect(resolveRouteRedirect('/deposit/history')).toEqual({
      pathname: '/wallet/deposit',
      search: { tab: 'history' },
    });
    expect(resolveRouteRedirect('/deposit/krw/pending')).toEqual({
      pathname: '/wallet/deposit/krw/pending',
    });
    expect(resolveRouteRedirect('/withdraw')).toEqual({ pathname: '/wallet/withdraw' });
    expect(resolveRouteRedirect('/withdraw/history')).toEqual({
      pathname: '/wallet/withdraw',
      search: { tab: 'history' },
    });
    expect(resolveRouteRedirect('/withdraw/crypto/queue')).toEqual({
      pathname: '/wallet/withdraw/crypto/queue',
    });
  });

  it('maps mission, betting, and tier aliases', () => {
    expect(resolveRouteRedirect('/missions')).toEqual({ pathname: '/home/missions' });
    expect(resolveRouteRedirect('/missions/daily')).toEqual({
      pathname: '/home/missions',
      search: { tab: 'daily' },
    });
    expect(resolveRouteRedirect('/home/missions/weekly')).toEqual({
      pathname: '/home/missions',
      search: { tab: 'weekly' },
    });
    expect(resolveRouteRedirect('/betting')).toEqual({ pathname: '/sports' });
    expect(resolveRouteRedirect('/betting/prematch')).toEqual({
      pathname: '/sports/prematch',
    });
    expect(resolveRouteRedirect('/betting/vip')).toEqual({ pathname: '/sports/vip' });
    expect(resolveRouteRedirect('/my-tier')).toEqual({ pathname: '/tier/me' });
    expect(resolveRouteRedirect('/my-tier/benefits')).toEqual({
      pathname: '/tier/benefits',
    });
    expect(resolveRouteRedirect('/tiers')).toEqual({ pathname: '/tier' });
    expect(resolveRouteRedirect('/tiers/gold')).toEqual({ pathname: '/tier/gold' });
  });

  it('maps finance, auth, and admin aliases', () => {
    expect(resolveRouteRedirect('/transactions')).toEqual({ pathname: '/ledger' });
    expect(resolveRouteRedirect('/transactions/abc-123')).toEqual({
      pathname: '/ledger/abc-123',
    });
    expect(resolveRouteRedirect('/register')).toEqual({ pathname: '/signup' });
    expect(resolveRouteRedirect('/forgot-password')).toEqual({ pathname: '/reset-password' });
    expect(resolveRouteRedirect('/report-bug')).toEqual({
      pathname: '/feedback',
      search: { type: 'bug' },
    });
    expect(resolveRouteRedirect('/admin/missions')).toEqual({
      pathname: '/admin/earn/missions',
    });
    expect(resolveRouteRedirect('/admin/referrals')).toEqual({
      pathname: '/admin/earn/referrals',
    });
    expect(resolveRouteRedirect('/admin/events')).toEqual({
      pathname: '/admin/promotions',
    });
  });

  it('maps wallet rail and settings aliases', () => {
    expect(resolveRouteRedirect('/wallet/deposit/usdt')).toEqual({
      pathname: '/wallet/deposit/crypto',
    });
    expect(resolveRouteRedirect('/wallet/deposit/voucher')).toEqual({
      pathname: '/wallet/deposit/giftcard',
    });
    expect(resolveRouteRedirect('/wallet/withdraw/usdt')).toEqual({
      pathname: '/wallet/withdraw/crypto',
    });
    expect(resolveRouteRedirect('/setup-2fa')).toEqual({ pathname: '/settings/security' });
    expect(resolveRouteRedirect('/settings/language')).toEqual({
      pathname: '/settings/preferences',
    });
    expect(resolveRouteRedirect('/settings/profile')).toEqual({ pathname: '/account/profile' });
    expect(resolveRouteRedirect('/risk-disclosure')).toEqual({
      pathname: '/legal/risk-disclosure',
    });
    expect(resolveRouteRedirect('/terms')).toEqual({ pathname: '/legal/terms' });
    expect(resolveRouteRedirect('/privacy')).toEqual({ pathname: '/legal/privacy' });
    expect(resolveRouteRedirect('/responsible-gaming')).toEqual({
      pathname: '/legal/responsible-gaming',
    });
    expect(resolveRouteRedirect('/responsible-gambling')).toEqual({
      pathname: '/legal/responsible-gaming',
    });
  });

  it('leaves canonical routes unchanged', () => {
    expect(resolveRouteRedirect('/home')).toBeNull();
    expect(resolveRouteRedirect('/sports')).toBeNull();
    expect(resolveRouteRedirect('/casino')).toBeNull();
    expect(resolveRouteRedirect('/wallet/deposit')).toBeNull();
    expect(resolveRouteRedirect('/home/missions')).toBeNull();
  });

  it('formats redirect href with search', () => {
    expect(
      formatRedirectHref({
        pathname: '/feedback',
        search: { type: 'bug' },
      }),
    ).toBe('/feedback?type=bug');
  });
});

describe('isForbiddenTradeSectionSearch', () => {
  it('flags sports, casino, and bet on /trade', () => {
    expect(isForbiddenTradeSectionSearch('/trade', '?section=sports')).toBe(true);
    expect(isForbiddenTradeSectionSearch('/trade', '?section=casino')).toBe(true);
    expect(isForbiddenTradeSectionSearch('/trade', '?section=bet')).toBe(true);
    expect(isForbiddenTradeSectionSearch('/trade', '?section=trade')).toBe(false);
    expect(isForbiddenTradeSectionSearch('/sports', '?section=sports')).toBe(false);
  });
});

describe('isRedirectOnlyPath', () => {
  it('identifies redirect-only aliases', () => {
    expect(isRedirectOnlyPath('/earn')).toBe(true);
    expect(isRedirectOnlyPath('/home')).toBe(false);
  });
});
