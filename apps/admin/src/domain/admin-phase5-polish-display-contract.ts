/**
 * Phase 5 Admin design-system parity + RBAC nav polish
 * (`phase5-admin` · `resume-phase5-admin`).
 *
 * Canon: ADMIN_UX_CANON.md · ADMIN_TEAM_RBAC_CANON.md · DESIGN_PRINCIPLES.
 * Scope: presentation only — no RPC/controller signature changes.
 */

import {
  ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST,
  assertP13AdminCanonicalDocsSync,
} from '@/domain/admin-beginner-language-display-contract';
import { EXCEPTION_QUEUE_CANON_ORDER } from '@/product/bridge/parse-ops-dashboard';

export const PHASE5_ADMIN_TODO = 'phase5-admin' as const;
export const RESUME_PHASE5_ADMIN_TODO = 'resume-phase5-admin' as const;

/** Finance → Risk/Users → Content/Growth → Ops/Team/Support → HI-QA. */
export const PHASE5_ADMIN_PART_ORDER = [
  'finance-desks',
  'risk-users',
  'content-growth',
  'ops-team-support',
  'hi-qa',
] as const;

export type Phase5AdminPart = (typeof PHASE5_ADMIN_PART_ORDER)[number];

/** Owner surfaces/primitives touched by this polish pass. */
export const PHASE5_ADMIN_OWNER_PATHS = [
  'product/layout/admin-nav.tsx',
  'product/layout/admin-shell.tsx',
  'product/bridge/parse-ops-dashboard.ts',
  'product/primitives/admin-table.tsx',
  'product/surfaces/admin-home-page.tsx',
  'product/surfaces/admin-settings-page.tsx',
  'product/surfaces/admin-mfa-enroll-page.tsx',
] as const;

/**
 * Human Interaction QA matrix — desktop-primary Admin (Grafana/Stripe bar).
 * Source-level contracts prove wiring; 1024/2560 (+390 mobile-nav spot) capture
 * remains operator/CDP evidence (G13 — no agent-local E2E).
 */
export const PHASE5_ADMIN_HI_QA_MATRIX = [
  {
    id: 'exception-queue-canon-order',
    surface: 'admin-home',
    interaction: 'read',
    ownerHint: 'parseOpsDashboard sortExceptionQueuesByCanon',
    pass: 'landing queues: withdrawal → deposit → kyc → aml/sanctions (not count-desc)',
  },
  {
    id: 'nav-hover-token',
    surface: 'admin-nav',
    interaction: 'mouse',
    ownerHint: 'admin-nav.tsx hover:bg-surface-hover',
    pass: 'defined surface-hover token — not undefined surface-elevated',
  },
  {
    id: 'nav-keyboard-focus-ring',
    surface: 'admin-nav',
    interaction: 'keyboard',
    ownerHint: 'NavLinkItem / NavGroupItem focus-visible ring',
    pass: 'brand focus ring on nav links (Tab visible)',
  },
  {
    id: 'mobile-role-primary-desks',
    surface: 'admin-mobile-nav',
    interaction: 'tap+horizontal-scroll',
    ownerHint: 'MOBILE_QUICK_NAV + filterAdminNavEntries',
    pass: '/support · /risk · /team present; RBAC still filters',
  },
  {
    id: 'rbac-finance-rewards',
    surface: 'admin-nav-rbac',
    interaction: 'read',
    ownerHint: 'ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.finance',
    pass: 'finance keeps /earn/rewards (fix-admin-rbac-nav-gaps)',
  },
  {
    id: 'rbac-support-withdrawals',
    surface: 'admin-nav-rbac',
    interaction: 'read',
    ownerHint: 'ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.support',
    pass: 'support keeps /withdrawals (fix-admin-rbac-nav-gaps)',
  },
  {
    id: 'admin-settings-section-empty',
    surface: 'admin-settings',
    interaction: 'read',
    ownerHint: 'admin-settings-page AdminTable empty=',
    pass: 'per-tab empty section shows EmptyState (not blank null)',
  },
  {
    id: 'token-border-line',
    surface: 'admin-settings+mfa',
    interaction: 'read',
    ownerHint: 'border-line · bg-surface-raised',
    pass: 'no undefined border-border / bg-surface-1',
  },
] as const;

export type Phase5AdminHiQaId = (typeof PHASE5_ADMIN_HI_QA_MATRIX)[number]['id'];

/** Phase 5 viewport evidence — desktop-primary + mobile-nav spot. */
export const PHASE5_ADMIN_VIEWPORT_WIDTHS = [390, 1024, 2560] as const;

export const PHASE5_ADMIN_THEMES = ['light', 'dark'] as const;

/** Nav must use defined hover + focus tokens. */
export const PHASE5_NAV_TOKEN_MARKERS = [
  'hover:bg-surface-hover',
  'focus-visible:ring-2',
  'focus-visible:ring-(--ds-focus)',
  'rounded-(--ds-radius-md)',
  'min-h-(--ds-touch-target-min)',
] as const;

/** Mobile quick nav must include role-primary desks (still RBAC-filtered). */
export const PHASE5_MOBILE_QUICK_NAV_ROUTES = [
  '/support',
  '/risk',
  '/team',
] as const;

export function assertAdminPhase5PolishContractSync(): void {
  assertP13AdminCanonicalDocsSync();

  if (PHASE5_ADMIN_PART_ORDER[0] !== 'finance-desks') {
    throw new Error('phase5-admin: finance desks must run first');
  }

  if (PHASE5_ADMIN_PART_ORDER[PHASE5_ADMIN_PART_ORDER.length - 1] !== 'hi-qa') {
    throw new Error('phase5-admin: HI-QA must close the part order');
  }

  if (PHASE5_ADMIN_HI_QA_MATRIX.length < 6) {
    throw new Error('phase5-admin: HI-QA matrix incomplete');
  }

  const hiIds = PHASE5_ADMIN_HI_QA_MATRIX.map((row) => row.id);
  if (new Set(hiIds).size !== hiIds.length) {
    throw new Error('phase5-admin: HI-QA ids must be unique');
  }

  if (!PHASE5_ADMIN_VIEWPORT_WIDTHS.includes(1024) || !PHASE5_ADMIN_VIEWPORT_WIDTHS.includes(2560)) {
    throw new Error('phase5-admin: desktop 1024/2560 evidence widths required');
  }

  if (!PHASE5_ADMIN_VIEWPORT_WIDTHS.includes(390)) {
    throw new Error('phase5-admin: mobile-nav 390 spot check required');
  }

  if (!ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.finance.includes('/earn/rewards')) {
    throw new Error('phase5-admin: finance must keep /earn/rewards');
  }

  if (!ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.support.includes('/withdrawals')) {
    throw new Error('phase5-admin: support must keep /withdrawals');
  }

  if (EXCEPTION_QUEUE_CANON_ORDER[0] !== 'withdrawal') {
    throw new Error('phase5-admin: exception queue canon must start with withdrawal');
  }

  if (!EXCEPTION_QUEUE_CANON_ORDER.includes('deposit')) {
    throw new Error('phase5-admin: exception queue canon must include deposit');
  }
}
