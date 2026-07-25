/**
 * P13 DOC — Admin canonical docs (§29.1 · §29.5 · §12.14↔§29.2 · §32.6).
 * Authority: `p13-prep-admin-canonical-docs` · Plan §29.5 · ADMIN_BEGINNER_LANGUAGE_CANON.md
 *
 * DOC only — Korean copy lives in @phonara/i18n + SSOT markdown (check:i18n).
 * `/admin/team` UI = `p13-prep-admin-team-desk`. Engine 0 (RPC wire only).
 */

export const P13_PREP_ADMIN_CANONICAL_DOCS_TODO = 'p13-prep-admin-canonical-docs' as const;

/** Prerequisite Track A GATE — must be closed before this DOC. */
export const P13_PREP_ADMIN_CANONICAL_DOCS_PREREQUISITE_TODO =
  'da-w8-gate-signature-experience' as const;

export const P13_PREP_ADMIN_CANONICAL_DOCS_PREREQUISITE_TODOS = [
  P13_PREP_ADMIN_CANONICAL_DOCS_PREREQUISITE_TODO,
] as const;

/** Next UI todo after this DOC bundle. */
export const P13_PREP_ADMIN_TEAM_DESK_TODO = 'p13-prep-admin-team-desk' as const;

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

/**
 * §29.1 glossary concept ids — operator-facing Korean is in ADMIN_BEGINNER_LANGUAGE_CANON.md
 * and (where wired) @phonara/i18n. Same meaning = same word (canon).
 */
export const ADMIN_BEGINNER_GLOSSARY_CONCEPTS = [
  'depositReview',
  'sendWithdrawal',
  'reject',
  'hold',
  'unusualActivity',
  'pendingWork',
  'reviewing',
  'done',
  'failed',
  'unsettledFixture',
  'settleFixture',
  'suspendMarket',
  'voidBet',
  'manualAdjust',
  'referralApprove',
  'auditRecord',
  'featureToggle',
  'maintenanceMode',
  'suspendUser',
  'releaseSelfExclusion',
  'clearRiskFlag',
  'giftcardFeeMarket',
  'reason',
  'todayWork',
] as const;

export type AdminBeginnerGlossaryConcept = (typeof ADMIN_BEGINNER_GLOSSARY_CONCEPTS)[number];

/** §29.1 status badge (6 concepts) — Admin ↔ user app same concept keys. */
export const ADMIN_BEGINNER_STATUS_CONCEPTS = [
  'pending',
  'reviewing',
  'settled',
  'failed',
  'rejected',
  'halted',
] as const;

export type AdminBeginnerStatusConcept = (typeof ADMIN_BEGINNER_STATUS_CONCEPTS)[number];

/** R3 modal fixed copy — i18n key (append-only ledger). */
export const ADMIN_R3_IRREVERSIBLE_I18N_KEY = 'admin.overview.irreversible' as const;

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
  '/earn/activity',
  '/viral-stats',
  '/tiers',
  '/tier-benefits',
  '/promotions',
  '/cms',
  '/casino',
  '/staking',
  '/audit',
  '/settings',
  '/ops',
  '/mfa/policy',
  '/team',
  '/support',
] as const;

/** Planned routes — nav keys must exist before surface ships (Plan §32.6). Empty when all desks live. */
export const ADMIN_BEGINNER_PLANNED_ROUTES = [] as const;

export const ADMIN_BEGINNER_ALL_ROUTES = [
  ...ADMIN_BEGINNER_P2_ROUTES,
  ...ADMIN_BEGINNER_PLANNED_ROUTES,
] as const;

/**
 * Nav label i18n keys per route — must stay within ADMIN_BEGINNER_LANGUAGE_CANON.md §2.
 * Korean values live in @phonara/i18n `admin.nav.*`.
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
  '/tier-benefits': 'admin.nav.tierBenefits',
  '/promotions': 'admin.nav.promotions',
  '/cms': 'admin.nav.cms',
  '/casino': 'admin.nav.casino',
  '/staking': 'admin.nav.staking',
  '/audit': 'admin.nav.audit',
  '/settings': 'admin.nav.settings',
  '/ops': 'admin.nav.ops',
  '/mfa/policy': 'admin.nav.mfa',
  '/team': 'admin.nav.team',
  '/support': 'admin.nav.support',
};

/** RBAC roles — operator-facing names via `admin.role.*` i18n. */
export const ADMIN_TEAM_ROLES = ['owner', 'finance', 'risk', 'support', 'viewer'] as const;

export type AdminTeamRole = (typeof ADMIN_TEAM_ROLES)[number];

export const ADMIN_TEAM_ROLE_LABEL_KEYS: Readonly<Record<AdminTeamRole, string>> = {
  owner: 'admin.role.owner',
  finance: 'admin.role.finance',
  risk: 'admin.role.risk',
  support: 'admin.role.support',
  viewer: 'admin.role.viewer',
};

/**
 * Role → menu allowlist as admin app routes (no `/admin` prefix).
 * Missing route = nav hide + RPC reject (both required).
 * Canon Korean labels: ADMIN_TEAM_RBAC_CANON.md + `admin.nav.*`.
 */
export const ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST: Readonly<
  Record<AdminTeamRole, readonly string[]>
> = {
  owner: [
    '/',
    '/queues',
    '/deposits',
    '/withdrawals',
    '/sports',
    '/users',
    '/risk',
    '/earn',
    '/earn/activity',
    '/viral-stats',
    '/tiers',
    '/tier-benefits',
    '/promotions',
    '/cms',
    '/casino',
    '/staking',
    '/audit',
    '/settings',
    '/mfa/policy',
    '/ops',
    '/team',
    '/support',
  ],
  finance: [
    '/',
    '/queues',
    '/deposits',
    '/withdrawals',
    '/audit',
    '/ops',
    '/earn/activity',
    '/earn/rewards',
  ],
  risk: [
    '/',
    '/queues',
    '/sports',
    '/users',
    '/risk',
    '/tiers',
    '/tier-benefits',
    '/casino',
    '/ops',
  ],
  support: ['/', '/queues', '/users', '/support', '/cms', '/withdrawals'],
  viewer: ['/', '/ops', '/earn/activity'],
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
  'admin.help.cms',
  'admin.help.promotions',
  'admin.help.casino',
  'admin.help.tierBenefits',
] as const;

/**
 * §29.2 round-33 extra desk rows — button intent ↔ RPC · risk grade.
 * Full P2 wire table lives in Plan §29.2; these pin the round-33 additions.
 */
export const ADMIN_BEGINNER_SECTION_29_2_EXTRA_ROWS = [
  {
    desk: '/admin/team',
    buttonIntents: ['grantRole', 'revokeRole'],
    rpcs: ['rpc_admin_set_role_grant'],
    grade: 'R3',
  },
  {
    desk: '/admin/support',
    buttonIntents: ['listTickets', 'resolveTicket'],
    rpcs: ['rpc_admin_list_support_tickets', 'rpc_admin_resolve_support_ticket'],
    grade: 'R0·R2',
  },
  {
    desk: '/admin/earn/activity',
    buttonIntents: ['viewActivityReadOnly'],
    rpcs: ['ops dashboard aggregates'],
    grade: 'R0',
  },
  {
    desk: '/admin/audit',
    buttonIntents: ['exportAuditCsv'],
    rpcs: ['audit export read path'],
    grade: 'R0',
  },
  {
    desk: '/admin/deposits',
    buttonIntents: ['viewDepositProof', 'markProofMatched'],
    rpcs: ['rpc_admin_review_krw_deposit_proof'],
    grade: 'R2',
  },
] as const;

/**
 * §12.14 canonical Admin routes that must appear in correspondence / beginner canon.
 * Paths use full `/admin/*` form (Plan §12.14).
 */
export const ADMIN_SECTION_12_14_CANONICAL_ROUTES = [
  '/admin',
  '/admin/queues',
  '/admin/deposits',
  '/admin/withdrawals',
  '/admin/ops',
  '/admin/users',
  '/admin/risk',
  '/admin/sports',
  '/admin/audit',
  '/admin/settings',
  '/admin/tiers',
  '/admin/earn',
  '/admin/earn/missions',
  '/admin/earn/rewards',
  '/admin/earn/referrals',
  '/admin/viral-stats',
  '/admin/earn/activity',
  '/admin/promotions',
  '/admin/cms',
  '/admin/casino',
  '/admin/tier-benefits',
  '/admin/support',
  '/admin/team',
  '/admin/staking',
] as const;

/**
 * User ↔ Admin correspondence — key money/betting rows (matrix DOC pin).
 * Full table: docs/PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md
 */
export const ADMIN_USER_CORRESPONDENCE_ROWS = [
  {
    userRoute: '/wallet/deposit/krw',
    adminRoute: '/admin/deposits',
    adminNavKey: 'admin.nav.deposits',
  },
  {
    userRoute: '/wallet/withdraw',
    adminRoute: '/admin/withdrawals',
    adminNavKey: 'admin.nav.withdrawals',
  },
  {
    userRoute: '/sports',
    adminRoute: '/admin/sports',
    adminNavKey: 'admin.nav.sports',
  },
  {
    userRoute: '/support',
    adminRoute: '/admin/support',
    adminNavKey: 'admin.nav.support',
  },
  {
    userRoute: '/account',
    adminRoute: '/admin/users',
    adminNavKey: 'admin.nav.users',
  },
] as const;

/** SSOT + contract artifacts required on disk (merge-50 · same PR required). */
export const P13_ADMIN_CANONICAL_DOCS_ARTIFACT_PATHS = [
  'docs/SSOT/ADMIN_BEGINNER_LANGUAGE_CANON.md',
  'docs/SSOT/ADMIN_TEAM_RBAC_CANON.md',
  'docs/PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md',
  'apps/admin/src/domain/admin-beginner-language-display-contract.ts',
  'apps/admin/src/domain/__tests__/admin-beginner-language-display-contract.test.ts',
] as const;

/** gate:ai-impl owner path. */
export const P13_ADMIN_CANONICAL_DOCS_TEST_PATHS = [
  'apps/admin/src/domain/__tests__/admin-beginner-language-display-contract.test.ts',
] as const;

/** Non-waivable sync for P13 Admin canonical DOC closeout. */
export function assertP13AdminCanonicalDocsSync(): void {
  if (
    !P13_PREP_ADMIN_CANONICAL_DOCS_PREREQUISITE_TODOS.includes(
      P13_PREP_ADMIN_CANONICAL_DOCS_PREREQUISITE_TODO,
    )
  ) {
    throw new Error(
      'p13-prep-admin-canonical-docs: missing prerequisite da-w8-gate-signature-experience',
    );
  }

  for (const route of ADMIN_BEGINNER_ALL_ROUTES) {
    if (!ADMIN_BEGINNER_NAV_LABEL_KEYS[route]) {
      throw new Error(`Missing nav label key for route: ${route}`);
    }
  }

  if (ADMIN_TEAM_ROLES.length !== 5) {
    throw new Error(`Expected 5 team roles, got ${ADMIN_TEAM_ROLES.length}`);
  }

  for (const role of ADMIN_TEAM_ROLES) {
    const menus = ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST[role];
    if (!menus || menus.length === 0) {
      throw new Error(`Empty menu allowlist for role: ${role}`);
    }
  }

  if (!ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.owner.includes('/team')) {
    throw new Error('owner must include /team');
  }
  if (ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.viewer.includes('/withdrawals')) {
    throw new Error('viewer must not see /withdrawals');
  }
  if (ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.finance.includes('/team')) {
    throw new Error('finance must not see /team');
  }
  // Align menu with admin-rbac permissions: support withdraw approve/reject · finance earn.settlement / wallet_adjust
  if (!ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.support.includes('/withdrawals')) {
    throw new Error('support must include /withdrawals (queues.withdraw.*)');
  }
  if (!ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.finance.includes('/earn/rewards')) {
    throw new Error('finance must include /earn/rewards (earn.settlement.approve · users.wallet_adjust)');
  }

  if (ADMIN_BEGINNER_STATUS_CONCEPTS.length !== 6) {
    throw new Error('Status concepts must be exactly 6');
  }

  if (ADMIN_BEGINNER_GLOSSARY_CONCEPTS.length < 20) {
    throw new Error('§29.1 glossary concepts incomplete');
  }

  if (ADMIN_BEGINNER_SECTION_29_2_EXTRA_ROWS.length < 5) {
    throw new Error('§29.2 round-33 extra rows incomplete');
  }

  if (ADMIN_SECTION_12_14_CANONICAL_ROUTES.length < 20) {
    throw new Error('§12.14 canonical route pin incomplete');
  }

  if (!ADMIN_SECTION_12_14_CANONICAL_ROUTES.includes('/admin/team')) {
    throw new Error('§12.14 must include /admin/team');
  }
  if (!ADMIN_SECTION_12_14_CANONICAL_ROUTES.includes('/admin/support')) {
    throw new Error('§12.14 must include /admin/support');
  }
}
