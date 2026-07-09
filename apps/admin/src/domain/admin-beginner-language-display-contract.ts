/**
 * §29.5 Admin beginner (elementary) language — display contract.
 * Authority: Plan §29.5 · docs/SSOT/ADMIN_BEGINNER_LANGUAGE_CANON.md
 */

/** Screen jargon that must never appear in admin product surfaces (nav labels, buttons, headings). */
export const ADMIN_FORBIDDEN_SCREEN_JARGON = [
  'queue',
  'desk',
  'settle',
  'void',
  'flag',
  'rpc_',
  'audit log',
  'pending',
  'compliance',
  'AML',
  'KYC',
] as const;

/** P2 wired admin routes (apps/admin — no `/admin` prefix). */
export const ADMIN_BEGINNER_P2_ROUTES = [
  '/',
  '/queues',
  '/deposits',
  '/withdrawals',
  '/sports',
  '/users',
  '/risk',
  '/earn',
  '/earn/referrals',
  '/earn/missions',
  '/earn/rewards',
  '/viral-stats',
  '/tiers',
  '/staking',
  '/audit',
  '/settings',
  '/ops',
  '/mfa/policy',
] as const;

/** Planned routes — nav keys must exist before surface ships (Plan §32.6). */
export const ADMIN_BEGINNER_PLANNED_ROUTES = ['/team', '/support', '/earn/activity'] as const;

export const ADMIN_BEGINNER_ALL_ROUTES = [
  ...ADMIN_BEGINNER_P2_ROUTES,
  ...ADMIN_BEGINNER_PLANNED_ROUTES,
] as const;

/**
 * Korean nav label keys per route — must stay within ADMIN_BEGINNER_LANGUAGE_CANON.md §2.
 * Values live in @phonara/i18n `admin.nav.*`.
 */
export const ADMIN_BEGINNER_NAV_LABEL_KEYS: Readonly<Record<string, string>> = {
  '/': 'admin.nav.overview',
  '/queues': 'admin.nav.queues',
  '/deposits': 'admin.nav.deposits',
  '/withdrawals': 'admin.nav.withdrawals',
  '/sports': 'admin.nav.sports',
  '/users': 'admin.nav.users',
  '/risk': 'admin.nav.risk',
  '/earn': 'admin.nav.earn',
  '/earn/referrals': 'admin.nav.referrals',
  '/earn/missions': 'admin.nav.missions',
  '/earn/rewards': 'admin.nav.rewards',
  '/earn/activity': 'admin.nav.earnActivity',
  '/viral-stats': 'admin.nav.viralStats',
  '/tiers': 'admin.nav.tiers',
  '/staking': 'admin.nav.staking',
  '/audit': 'admin.nav.audit',
  '/settings': 'admin.nav.settings',
  '/ops': 'admin.nav.ops',
  '/mfa/policy': 'admin.nav.mfa',
  '/team': 'admin.nav.team',
  '/support': 'admin.nav.support',
};

/** RBAC roles — operator-facing names in ADMIN_TEAM_RBAC_CANON.md */
export const ADMIN_TEAM_ROLES = ['owner', 'finance', 'risk', 'support', 'viewer'] as const;

export type AdminTeamRole = (typeof ADMIN_TEAM_ROLES)[number];

export const ADMIN_TEAM_ROLE_LABEL_KEYS: Readonly<Record<AdminTeamRole, string>> = {
  owner: 'admin.role.owner',
  finance: 'admin.role.finance',
  risk: 'admin.role.risk',
  support: 'admin.role.support',
  viewer: 'admin.role.viewer',
};

/** Help tip keys — every desk needs admin.help.{desk} (3 sentences max). */
export const ADMIN_BEGINNER_HELP_KEYS = [
  'admin.help.overview',
  'admin.help.queues',
  'admin.help.deposits',
  'admin.help.withdrawals',
  'admin.help.sports',
  'admin.help.users',
  'admin.help.risk',
  'admin.help.earn',
  'admin.help.tiers',
  'admin.help.staking',
  'admin.help.audit',
  'admin.help.settings',
  'admin.help.operations',
  'admin.help.team',
  'admin.help.support',
  'admin.help.earnActivity',
] as const;
