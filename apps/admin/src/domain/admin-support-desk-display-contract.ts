/**
 * E9 UI — `/admin/support` member inquiry desk (§29.5 · queues convergence).
 * Authority: `ew-e9-page-admin-support` · ENGINE:ew-e9 tickets
 * Engine: `rpc_admin_list_support_tickets` · `rpc_admin_resolve_support_ticket` (AAL2 · reason).
 */

import {
  ADMIN_BEGINNER_SECTION_29_2_EXTRA_ROWS,
  ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST,
} from './admin-beginner-language-display-contract';
import type { AdminRbacRole } from './admin-rbac';

export const EW_E9_PAGE_ADMIN_SUPPORT_TODO = 'ew-e9-page-admin-support' as const;
export const EW_E9_PAGE_ADMIN_SUPPORT_PREREQUISITE_TODO =
  'ew-e9-gate-identity-support' as const;
export const EW_E9_PAGE_ADMIN_SUPPORT_NEXT_TODO =
  'ew-e10-platform-engine-wave' as const;

export const ADMIN_SUPPORT_DESK_ROUTE = '/support' as const;
export const ADMIN_SUPPORT_DESK_FULL_PATH = '/admin/support' as const;

export const ADMIN_SUPPORT_DESK_RPCS = [
  'rpc_admin_list_support_tickets',
  'rpc_admin_resolve_support_ticket',
  'rpc_get_support_ticket',
] as const;

export const ADMIN_SUPPORT_TICKET_STATUSES = [
  'open',
  'in_progress',
  'resolved',
  'closed',
] as const;

export type AdminSupportTicketStatus = (typeof ADMIN_SUPPORT_TICKET_STATUSES)[number];

export const ADMIN_SUPPORT_OPEN_STATUSES = ['open', 'in_progress'] as const;

export type AdminSupportOpenStatus = (typeof ADMIN_SUPPORT_OPEN_STATUSES)[number];

export const ADMIN_SUPPORT_TICKET_CATEGORIES = [
  'account',
  'wallet',
  'trade',
  'sports',
  'casino',
  'earn',
  'other',
] as const;

export type AdminSupportTicketCategory =
  (typeof ADMIN_SUPPORT_TICKET_CATEGORIES)[number];

export const ADMIN_SUPPORT_TICKET_PRIORITIES = ['low', 'normal', 'high'] as const;

export type AdminSupportTicketPriority =
  (typeof ADMIN_SUPPORT_TICKET_PRIORITIES)[number];

/** Open tickets feed `/admin/queues` exception summary (Plan §12.14 · help step3). */
export const ADMIN_SUPPORT_QUEUES_CONVERGENCE = true as const;

export const ADMIN_SUPPORT_DESK_SURFACE_PATH =
  'apps/admin/src/product/surfaces/admin-support-page.tsx' as const;

export const ADMIN_SUPPORT_DESK_ROUTE_PATH =
  'apps/admin/src/routes/support.tsx' as const;

export const ADMIN_SUPPORT_DESK_HOOK_PATH =
  'apps/admin/src/hooks/admin/useAdminSupportDesk.ts' as const;

export const EW_E9_ADMIN_SUPPORT_ARTIFACT_PATHS = [
  ADMIN_SUPPORT_DESK_SURFACE_PATH,
  ADMIN_SUPPORT_DESK_ROUTE_PATH,
  ADMIN_SUPPORT_DESK_HOOK_PATH,
  'apps/admin/src/domain/admin-support-desk-display-contract.ts',
  'apps/admin/src/domain/__tests__/admin-support-desk-display-contract.test.ts',
  'apps/admin/src/product/surfaces/__tests__/admin-support-page.test.tsx',
  'docs/OPERATIONS/ENGINE_GAP_E9_ADMIN_SUPPORT.md',
] as const;

export const EW_E9_ADMIN_SUPPORT_TEST_PATHS = [
  'apps/admin/src/domain/__tests__/admin-support-desk-display-contract.test.ts',
  'apps/admin/src/product/surfaces/__tests__/admin-support-page.test.tsx',
] as const;

/** Roles that may open the member-inquiry desk (nav + page gate). Server RPC still authoritative. */
export function canAccessAdminSupportDesk(role: AdminRbacRole): boolean {
  if (role === 'owner' || role === 'support') return true;
  if (role === 'operator') return false;
  const allow = ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST[
    role === 'finance' || role === 'risk' || role === 'viewer' ? role : 'viewer'
  ];
  return allow.includes(ADMIN_SUPPORT_DESK_ROUTE);
}

export function isAdminSupportOpenStatus(
  status: string,
): status is AdminSupportOpenStatus {
  return (ADMIN_SUPPORT_OPEN_STATUSES as readonly string[]).includes(status);
}

export function assertEwE9AdminSupportDeskSync(): void {
  if (EW_E9_PAGE_ADMIN_SUPPORT_TODO !== 'ew-e9-page-admin-support') {
    throw new Error('admin support todo id drift');
  }
  if (EW_E9_PAGE_ADMIN_SUPPORT_PREREQUISITE_TODO !== 'ew-e9-gate-identity-support') {
    throw new Error('admin support prerequisite must be E9 GATE');
  }
  if (EW_E9_PAGE_ADMIN_SUPPORT_NEXT_TODO !== 'ew-e10-platform-engine-wave') {
    throw new Error('admin support next must be E10 platform wave');
  }
  if (!ADMIN_SUPPORT_QUEUES_CONVERGENCE) {
    throw new Error('support tickets must converge into queues summary');
  }
  const supportRow = ADMIN_BEGINNER_SECTION_29_2_EXTRA_ROWS.find(
    (row) => row.desk === ADMIN_SUPPORT_DESK_FULL_PATH,
  );
  if (!supportRow) {
    throw new Error('§29.2 must pin /admin/support');
  }
  if (
    !supportRow.rpcs.includes('rpc_admin_list_support_tickets') ||
    !supportRow.rpcs.includes('rpc_admin_resolve_support_ticket')
  ) {
    throw new Error('§29.2 support RPCs drift');
  }
  if (!ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.owner.includes('/support')) {
    throw new Error('owner must see /support');
  }
  if (!ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.support.includes('/support')) {
    throw new Error('support role must see /support');
  }
  if (ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.viewer.includes('/support')) {
    throw new Error('viewer must not see /support');
  }
  if (ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.finance.includes('/support')) {
    throw new Error('finance must not see /support');
  }
  if (!canAccessAdminSupportDesk('owner') || !canAccessAdminSupportDesk('support')) {
    throw new Error('owner and support must access support desk');
  }
  if (canAccessAdminSupportDesk('viewer') || canAccessAdminSupportDesk('finance')) {
    throw new Error('viewer/finance must not access support desk');
  }
}
