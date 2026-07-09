/**
 * Admin security gate S1–S4 + live desk route wire contract.
 *
 * Desk paths must match `apps/admin/src/routes/` + `admin-nav.tsx`.
 * Stale Phase-9 ghosts (`/casino`, `/cms`, `/operations`, `/overview`) removed — R0.
 */

/** Standalone admin SPA paths (ZIP `/admin/*` → apps/admin). */
export const ADMIN_LOGIN_ROUTE = '/login' as const;
export const ADMIN_MFA_ENROLL_ROUTE = '/mfa/enroll' as const;
export const ADMIN_MFA_CHALLENGE_ROUTE = '/mfa/challenge' as const;
export const ADMIN_MFA_POLICY_ROUTE = '/mfa/policy' as const;

export const ADMIN_MFA_ROUTES = [
  ADMIN_LOGIN_ROUTE,
  ADMIN_MFA_ENROLL_ROUTE,
  ADMIN_MFA_CHALLENGE_ROUTE,
  ADMIN_MFA_POLICY_ROUTE,
] as const;

export type AdminMfaRoute = (typeof ADMIN_MFA_ROUTES)[number];

/** Live AdminShell desk routes (no `/casino` · `/cms` · `/operations` ghosts). */
export const ADMIN_DESK_ROUTES = [
  '/',
  '/queues',
  '/deposits',
  '/withdrawals',
  '/sports',
  '/earn',
  '/earn/referrals',
  '/earn/missions',
  '/earn/rewards',
  '/viral-stats',
  '/users',
  '/tiers',
  '/risk',
  '/staking',
  '/audit',
  '/settings',
  '/ops',
  ADMIN_MFA_POLICY_ROUTE,
] as const;

export type AdminDeskRoute = (typeof ADMIN_DESK_ROUTES)[number];

/** Route → page component mapping (surfaces under AdminShell). */
export const ADMIN_DESK_ROUTE_PAGES: Readonly<Record<AdminDeskRoute, string>> = {
  '/': 'AdminHomePage',
  '/queues': 'AdminQueuesPage',
  '/deposits': 'AdminDepositsPage',
  '/withdrawals': 'AdminWithdrawalsPage',
  '/sports': 'AdminSportsPage',
  '/earn': 'AdminEarnPage',
  '/earn/referrals': 'AdminEarnReferralsPage',
  '/earn/missions': 'AdminEarnMissionsPage',
  '/earn/rewards': 'AdminEarnRewardsPage',
  '/viral-stats': 'AdminViralStatsPage',
  '/users': 'AdminUsersPage',
  '/tiers': 'AdminTiersPage',
  '/risk': 'AdminRiskPage',
  '/staking': 'AdminStakingPage',
  '/audit': 'AdminAuditPage',
  '/settings': 'AdminSettingsPage',
  '/ops': 'AdminOpsPage',
  '/mfa/policy': 'AdminMfaPage',
};

/** Phase 9 S1–S4 inline security checklist (security-auditor advisory at gate-exit). */
export const ADMIN_SECURITY_S1_S4_STATUS: Readonly<
  Record<'S1' | 'S2' | 'S3' | 'S4', 'wired' | 'operator_pending'>
> = {
  /** Inline checklist + domain contract — operator security-auditor at L5. */
  S1: 'wired',
  /** Session redirect · MFA step-up · profiles role gate — engine signature 0. */
  S2: 'wired',
  /** Negative auth: non-admin `admin-forbidden` · RPC rejects in admin.spec E2E. */
  S3: 'wired',
  /** Manual actions → `audit_logs` via `useAuditLogs` + desk audit trails. */
  S4: 'wired',
};

export const ADMIN_NEGATIVE_AUTH_TEST_IDS = {
  forbidden: 'admin-forbidden',
  loginForm: 'admin-login-form',
  mfaEnroll: 'admin-mfa-enroll-page',
  mfaChallenge: 'admin-mfa-challenge-page',
} as const;

/** E1a deposit recon RPCs — display-only admin match/flag (money path server-trusted). */
export const ADMIN_DEPOSIT_RECON_RPCS = {
  matchKrw: 'rpc_admin_match_krw_deposit',
  matchCrypto: 'rpc_admin_match_crypto_deposit',
  flag: 'rpc_admin_flag_deposit',
} as const;

/**
 * User ↔ admin correspondence.
 * No dedicated `/casino` or `/cms` admin desks — casino feature kill lives on `/ops`;
 * landing/CMS-style config is read via `/settings`.
 */
export const ADMIN_USER_CORRESPONDENCE: Readonly<
  Array<{ userSurface: string; adminRoute: AdminDeskRoute; wireStatus: 'wired' }>
> = [
  { userSurface: '/wallet', adminRoute: '/queues', wireStatus: 'wired' },
  { userSurface: '/casino', adminRoute: '/ops', wireStatus: 'wired' },
  { userSurface: '/sports', adminRoute: '/sports', wireStatus: 'wired' },
  { userSurface: '/home', adminRoute: '/earn', wireStatus: 'wired' },
  { userSurface: '/staking', adminRoute: '/staking', wireStatus: 'wired' },
  { userSurface: '/account', adminRoute: '/users', wireStatus: 'wired' },
  { userSurface: '/', adminRoute: '/settings', wireStatus: 'wired' },
];

export const ADMIN_ROUTE_WIRE_STATUS: Readonly<Record<AdminMfaRoute | AdminDeskRoute, 'wired'>> = {
  '/login': 'wired',
  '/mfa/enroll': 'wired',
  '/mfa/challenge': 'wired',
  '/mfa/policy': 'wired',
  '/': 'wired',
  '/queues': 'wired',
  '/deposits': 'wired',
  '/withdrawals': 'wired',
  '/sports': 'wired',
  '/earn': 'wired',
  '/earn/referrals': 'wired',
  '/earn/missions': 'wired',
  '/earn/rewards': 'wired',
  '/viral-stats': 'wired',
  '/users': 'wired',
  '/tiers': 'wired',
  '/risk': 'wired',
  '/staking': 'wired',
  '/audit': 'wired',
  '/settings': 'wired',
  '/ops': 'wired',
};

/** Route modules that exist on disk (redirects omitted). */
export const ADMIN_DESK_SURFACES = [
  'apps/admin/src/routes/index.tsx',
  'apps/admin/src/routes/queues.tsx',
  'apps/admin/src/routes/deposits.tsx',
  'apps/admin/src/routes/withdrawals.tsx',
  'apps/admin/src/routes/sports.tsx',
  'apps/admin/src/routes/earn.tsx',
  'apps/admin/src/routes/earn/index.tsx',
  'apps/admin/src/routes/earn/referrals.tsx',
  'apps/admin/src/routes/earn/missions.tsx',
  'apps/admin/src/routes/earn/rewards.tsx',
  'apps/admin/src/routes/viral-stats.tsx',
  'apps/admin/src/routes/users.tsx',
  'apps/admin/src/routes/tiers.tsx',
  'apps/admin/src/routes/risk.tsx',
  'apps/admin/src/routes/staking.tsx',
  'apps/admin/src/routes/audit.tsx',
  'apps/admin/src/routes/settings.tsx',
  'apps/admin/src/routes/ops.tsx',
  'apps/admin/src/routes/mfa/policy.tsx',
] as const;

export const ADMIN_MFA_AUTH_SURFACES = [
  'apps/admin/src/routes/login.tsx',
  'apps/admin/src/routes/mfa/enroll.tsx',
  'apps/admin/src/routes/mfa/challenge.tsx',
  'apps/admin/src/routes/mfa/policy.tsx',
  'apps/admin/src/routes/__root.tsx',
  'apps/admin/src/hooks/use-admin-route-gate.ts',
] as const;

/** Ghost paths removed in R0 — must not reappear as wired desks. */
export const ADMIN_STALE_DESK_ROUTES_REMOVED = [
  '/casino',
  '/cms',
  '/operations',
  '/overview',
] as const;
