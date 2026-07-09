/**
 * §12.17 Redirect / alias SOT — parallel hub 0.
 * Order: exact rules (longest first) → prefix rules (longest first) → query rules.
 */

export type RouteRedirectSearch = Record<string, string>;

export type ExactRouteRedirect = {
  kind: 'exact';
  from: string;
  to: string;
  search?: RouteRedirectSearch;
};

export type PrefixRouteRedirect = {
  kind: 'prefix';
  fromPrefix: string;
  toPrefix: string;
};

export type QueryRouteRedirect = {
  kind: 'query';
  pathname: string;
  param: string;
  value: string;
  to: string;
};

export type RouteRedirectRule = ExactRouteRedirect | PrefixRouteRedirect | QueryRouteRedirect;

/** Legacy Bet hub — forbidden on `/trade` (§12.19). */
export const LEGACY_TRADE_SECTION_REDIRECTS: Readonly<Record<string, string>> = {
  sports: '/sports',
  casino: '/casino',
  bet: '/sports',
};

/** §12.17 canonical redirect table (Phase R plan). */
export const ROUTE_REDIRECT_RULES: readonly RouteRedirectRule[] = [
  // Trade legacy ?section= (query rules — evaluated before path rules)
  { kind: 'query', pathname: '/trade', param: 'section', value: 'sports', to: '/sports' },
  { kind: 'query', pathname: '/trade', param: 'section', value: 'casino', to: '/casino' },
  { kind: 'query', pathname: '/trade', param: 'section', value: 'bet', to: '/sports' },

  // Exact — longest paths first (wildcard precedence)
  { kind: 'exact', from: '/wallet/deposit/usdt', to: '/wallet/deposit/crypto' },
  { kind: 'exact', from: '/wallet/deposit/voucher', to: '/wallet/deposit/giftcard' },
  { kind: 'exact', from: '/wallet/withdraw/usdt', to: '/wallet/withdraw/crypto' },
  { kind: 'exact', from: '/missions/invite', to: '/home/missions/invite' },
  { kind: 'exact', from: '/missions/referral', to: '/home/missions/referral' },
  { kind: 'exact', from: '/missions/daily', to: '/home/missions', search: { tab: 'daily' } },
  { kind: 'exact', from: '/missions/weekly', to: '/home/missions', search: { tab: 'weekly' } },
  { kind: 'exact', from: '/missions/special', to: '/home/missions', search: { tab: 'special' } },
  { kind: 'exact', from: '/home/missions/daily', to: '/home/missions', search: { tab: 'daily' } },
  { kind: 'exact', from: '/home/missions/weekly', to: '/home/missions', search: { tab: 'weekly' } },
  {
    kind: 'exact',
    from: '/home/missions/special',
    to: '/home/missions',
    search: { tab: 'special' },
  },
  { kind: 'exact', from: '/home/missions/viral', to: '/home/missions', search: { tab: 'viral' } },
  { kind: 'exact', from: '/home/missions/growth', to: '/home/missions', search: { tab: 'growth' } },
  { kind: 'exact', from: '/home/missions/tier', to: '/home/missions', search: { tab: 'tier' } },
  { kind: 'exact', from: '/home/missions/social', to: '/home/missions', search: { tab: 'social' } },
  { kind: 'exact', from: '/deposit/history', to: '/wallet/deposit', search: { tab: 'history' } },
  { kind: 'exact', from: '/withdraw/history', to: '/wallet/withdraw', search: { tab: 'history' } },
  { kind: 'exact', from: '/betting/vip', to: '/sports/vip' },
  { kind: 'exact', from: '/settings/profile', to: '/account/profile' },
  { kind: 'exact', from: '/settings/language', to: '/settings/preferences' },
  { kind: 'exact', from: '/admin/missions', to: '/admin/earn/missions' },
  { kind: 'exact', from: '/admin/referrals', to: '/admin/earn/referrals' },
  { kind: 'exact', from: '/admin/events', to: '/admin/promotions' },
  { kind: 'exact', from: '/risk-disclosure', to: '/legal/risk-disclosure' },
  { kind: 'exact', from: '/terms', to: '/legal/terms' },
  { kind: 'exact', from: '/privacy', to: '/legal/privacy' },
  { kind: 'exact', from: '/responsible-gaming', to: '/legal/responsible-gaming' },
  { kind: 'exact', from: '/responsible-gambling', to: '/legal/responsible-gaming' },
  { kind: 'exact', from: '/forgot-password', to: '/reset-password' },
  { kind: 'exact', from: '/earn-intro', to: '/features/earn' },
  { kind: 'exact', from: '/points/shop', to: '/wallet/redeem' },
  { kind: 'exact', from: '/vip-benefits', to: '/features/vip' },
  { kind: 'exact', from: '/report-bug', to: '/feedback', search: { type: 'bug' } },
  { kind: 'exact', from: '/setup-2fa', to: '/settings/security' },
  { kind: 'exact', from: '/register', to: '/signup' },
  { kind: 'exact', from: '/attendance', to: '/home/attendance' },
  { kind: 'exact', from: '/transactions', to: '/ledger' },
  { kind: 'exact', from: '/dashboard', to: '/home' },
  { kind: 'exact', from: '/missions', to: '/home/missions' },
  { kind: 'exact', from: '/cashback', to: '/earn/cashback' },
  { kind: 'exact', from: '/betting', to: '/sports' },
  { kind: 'exact', from: '/my-tier/benefits', to: '/tier/benefits' },
  { kind: 'exact', from: '/tier/me/benefits', to: '/tier/benefits' },
  { kind: 'exact', from: '/tiers/benefits', to: '/tier/benefits' },
  { kind: 'exact', from: '/my-tier', to: '/tier/me' },
  { kind: 'exact', from: '/my-earn', to: '/staking/positions' },
  { kind: 'exact', from: '/profile', to: '/account/profile' },
  { kind: 'exact', from: '/deposit', to: '/wallet/deposit' },
  { kind: 'exact', from: '/withdraw', to: '/wallet/withdraw' },
  { kind: 'exact', from: '/invite', to: '/referral/invite' },
  { kind: 'exact', from: '/earn', to: '/home' },
  { kind: 'exact', from: '/tiers', to: '/tier' },
  { kind: 'exact', from: '/kyc', to: '/account/kyc' },

  // Prefix — longest first
  { kind: 'prefix', fromPrefix: '/transactions/', toPrefix: '/ledger/' },
  { kind: 'prefix', fromPrefix: '/missions/', toPrefix: '/home/missions/' },
  { kind: 'prefix', fromPrefix: '/my-tier/', toPrefix: '/tier/me/' },
  { kind: 'prefix', fromPrefix: '/deposit/', toPrefix: '/wallet/deposit/' },
  { kind: 'prefix', fromPrefix: '/withdraw/', toPrefix: '/wallet/withdraw/' },
  { kind: 'prefix', fromPrefix: '/betting/', toPrefix: '/sports/' },
  { kind: 'prefix', fromPrefix: '/tiers/', toPrefix: '/tier/' },
];
