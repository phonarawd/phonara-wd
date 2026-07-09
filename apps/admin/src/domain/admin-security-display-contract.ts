/**
 * Admin Phase 9 — security gate S1–S4 + route/desk wire contract.
 *
 * Authority: `MASTER_TODO.md` §Phase 9 · `ROUTE_ENGINE_CONTRACT.md` Phase 9
 * · `p9-gate-security-s1-s4` · `p9-gate-exit`
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

export const ADMIN_DESK_ROUTES = [
  '/overview',
  '/alerts',
  '/queues',
  '/audit',
  '/operations',
  '/users',
  '/settings',
  '/sports',
  '/casino',
  '/earn',
  '/staking',
  '/cms',
  ADMIN_MFA_POLICY_ROUTE,
] as const;

export type AdminDeskRoute = (typeof ADMIN_DESK_ROUTES)[number];

/** Route file → page component mapping (13 desk surfaces under AdminShell). */
export const ADMIN_DESK_ROUTE_PAGES: Readonly<
  Record<
    Exclude<AdminDeskRoute, typeof ADMIN_MFA_POLICY_ROUTE> | typeof ADMIN_MFA_POLICY_ROUTE,
    string
  >
> = {
  '/overview': 'AdminOverviewPage',
  '/alerts': 'AdminAlertsPage',
  '/queues': 'AdminQueuesPage',
  '/audit': 'AdminAuditPage',
  '/operations': 'AdminOperationsPage',
  '/users': 'AdminUsersPage',
  '/settings': 'AdminSettingsPage',
  '/sports': 'AdminSportsPage',
  '/casino': 'AdminCasinoPage',
  '/earn': 'AdminEarnPage',
  '/staking': 'AdminStakingPage',
  '/cms': 'AdminCmsPage',
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

/** User ↔ admin 1:1 correspondence (subset — full matrix in operator docs). */
export const ADMIN_USER_CORRESPONDENCE: Readonly<
  Array<{ userSurface: string; adminRoute: AdminDeskRoute; wireStatus: 'wired' }>
> = [
  { userSurface: '/wallet', adminRoute: '/queues', wireStatus: 'wired' },
  { userSurface: '/casino', adminRoute: '/casino', wireStatus: 'wired' },
  { userSurface: '/sports', adminRoute: '/sports', wireStatus: 'wired' },
  { userSurface: '/home', adminRoute: '/earn', wireStatus: 'wired' },
  { userSurface: '/staking', adminRoute: '/staking', wireStatus: 'wired' },
  { userSurface: '/account', adminRoute: '/users', wireStatus: 'wired' },
  { userSurface: '/', adminRoute: '/cms', wireStatus: 'wired' },
];

export const ADMIN_ROUTE_WIRE_STATUS: Readonly<Record<AdminMfaRoute | AdminDeskRoute, 'wired'>> = {
  '/login': 'wired',
  '/mfa/enroll': 'wired',
  '/mfa/challenge': 'wired',
  '/mfa/policy': 'wired',
  '/overview': 'wired',
  '/alerts': 'wired',
  '/queues': 'wired',
  '/audit': 'wired',
  '/operations': 'wired',
  '/users': 'wired',
  '/settings': 'wired',
  '/sports': 'wired',
  '/casino': 'wired',
  '/earn': 'wired',
  '/staking': 'wired',
  '/cms': 'wired',
};

export const ADMIN_DESK_SURFACES = [
  'apps/admin/src/routes/overview.tsx',
  'apps/admin/src/routes/alerts.tsx',
  'apps/admin/src/routes/queues.tsx',
  'apps/admin/src/routes/audit.tsx',
  'apps/admin/src/routes/operations.tsx',
  'apps/admin/src/routes/users.tsx',
  'apps/admin/src/routes/settings.tsx',
  'apps/admin/src/routes/sports.tsx',
  'apps/admin/src/routes/casino.tsx',
  'apps/admin/src/routes/earn.tsx',
  'apps/admin/src/routes/staking.tsx',
  'apps/admin/src/routes/cms.tsx',
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
