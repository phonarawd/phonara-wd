/**
 * P13 UI — `/admin/team` staff role grant desk (§29.5 · §32.6).
 * Authority: `p13-prep-admin-team-desk` · ADMIN_TEAM_RBAC_CANON.md
 * Engine: `rpc_admin_list_role_grants` · `rpc_admin_set_role_grant` (owner + AAL2).
 */

import {
  ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST,
  ADMIN_TEAM_ROLES,
  type AdminTeamRole,
  P13_PREP_ADMIN_TEAM_DESK_TODO,
} from './admin-beginner-language-display-contract';
import type { AdminRbacRole } from './admin-rbac';

export { P13_PREP_ADMIN_TEAM_DESK_TODO };

export const ADMIN_TEAM_DESK_ROUTE = '/team' as const;
export const ADMIN_TEAM_DESK_FULL_PATH = '/admin/team' as const;

export const ADMIN_TEAM_DESK_RPCS = [
  'rpc_admin_list_role_grants',
  'rpc_admin_set_role_grant',
] as const;

/** §29.5 grant dropdown — 5 beginner roles only (no `operator`). */
export const ADMIN_TEAM_GRANTABLE_ROLES = ADMIN_TEAM_ROLES;

export type AdminTeamGrantableRole = (typeof ADMIN_TEAM_GRANTABLE_ROLES)[number];

export const ADMIN_TEAM_DESK_SURFACE_PATH =
  'apps/admin/src/product/surfaces/admin-team-page.tsx' as const;

export const ADMIN_TEAM_DESK_ROUTE_PATH = 'apps/admin/src/routes/team.tsx' as const;

export const ADMIN_TEAM_DESK_HOOK_PATH = 'apps/admin/src/hooks/admin/useAdminTeamDesk.ts' as const;

export const P13_ADMIN_TEAM_DESK_ARTIFACT_PATHS = [
  ADMIN_TEAM_DESK_SURFACE_PATH,
  ADMIN_TEAM_DESK_ROUTE_PATH,
  ADMIN_TEAM_DESK_HOOK_PATH,
  'apps/admin/src/domain/admin-team-desk-display-contract.ts',
  'apps/admin/src/domain/__tests__/admin-team-desk-display-contract.test.ts',
  'apps/admin/src/product/surfaces/__tests__/admin-team-page.test.tsx',
] as const;

export const P13_ADMIN_TEAM_DESK_TEST_PATHS = [
  'apps/admin/src/domain/__tests__/admin-team-desk-display-contract.test.ts',
  'apps/admin/src/product/surfaces/__tests__/admin-team-page.test.tsx',
] as const;

/** Map engine RBAC role → §29.5 menu allowlist role (operator → risk, no /team). */
export function resolveTeamMenuRole(role: AdminRbacRole): AdminTeamRole {
  if (role === 'operator') return 'risk';
  if ((ADMIN_TEAM_ROLES as readonly string[]).includes(role)) {
    return role as AdminTeamRole;
  }
  return 'viewer';
}

/** Nav / deep-link visibility — server RPC still authoritative. */
export function canAccessAdminTeamDesk(role: AdminRbacRole): boolean {
  return role === 'owner';
}

/** Whether a desk path (no `/admin` prefix) is visible for the operator role. */
export function isAdminNavRouteAllowed(role: AdminRbacRole, routePath: string): boolean {
  const teamRole = resolveTeamMenuRole(role);
  const allow = ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST[teamRole];
  const normalized =
    routePath.length > 1 && routePath.endsWith('/') ? routePath.slice(0, -1) : routePath;
  return allow.some((entry) => normalized === entry || normalized.startsWith(`${entry}/`));
}

export function assertP13AdminTeamDeskSync(): void {
  if (P13_PREP_ADMIN_TEAM_DESK_TODO !== 'p13-prep-admin-team-desk') {
    throw new Error('team desk todo id drift');
  }
  if (!ADMIN_TEAM_GRANTABLE_ROLES.includes('owner')) {
    throw new Error('grantable roles must include owner');
  }
  if (ADMIN_TEAM_GRANTABLE_ROLES.length !== 5) {
    throw new Error(`Expected 5 grantable roles, got ${ADMIN_TEAM_GRANTABLE_ROLES.length}`);
  }
  if (!ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.owner.includes('/team')) {
    throw new Error('owner must see /team');
  }
  if (ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.finance.includes('/team')) {
    throw new Error('finance must not see /team');
  }
  if (canAccessAdminTeamDesk('finance')) {
    throw new Error('finance must not access team desk');
  }
  if (!canAccessAdminTeamDesk('owner')) {
    throw new Error('owner must access team desk');
  }
}
