/** Client-side RBAC matrix — server RPC/RLS remains authoritative. */

export type AdminRbacRole = 'owner' | 'finance' | 'risk' | 'support' | 'operator' | 'viewer';

export type AdminRbacAction =
  | 'queues.withdraw.approve'
  | 'queues.withdraw.reject'
  | 'queues.kyc.review'
  | 'queues.str.manage'
  | 'queues.risk.clear'
  | 'operations.kill_switch'
  | 'users.moderate'
  | 'users.wallet_adjust'
  | 'users.tier.write'
  | 'casino.manage'
  | 'earn.settlement.approve'
  | 'access.rbac.manage'
  | 'alerts.manage'
  | 'support.tickets.resolve';

export type AdminRoleGrantRow = {
  userId: string;
  role: AdminRbacRole;
  enabled: boolean;
};

export const ADMIN_RBAC_ROLES: AdminRbacRole[] = [
  'owner',
  'finance',
  'risk',
  'support',
  'operator',
  'viewer',
];

/** Fail-closed default when grants are unknown, loading, or empty-enabled. */
export const ADMIN_RBAC_FAIL_CLOSED_ROLE: AdminRbacRole = 'viewer';

export const ADMIN_OPERATOR_ROLE_STORAGE_KEY = 'phonara-admin-operator-role-v1';

const ROLE_RANK: Record<AdminRbacRole, number> = {
  owner: 6,
  finance: 5,
  risk: 4,
  operator: 3,
  support: 2,
  viewer: 1,
};

const PERMISSIONS: Record<AdminRbacAction, readonly AdminRbacRole[]> = {
  'queues.withdraw.approve': ['owner', 'finance', 'support'],
  'queues.withdraw.reject': ['owner', 'finance', 'support'],
  'queues.kyc.review': ['owner', 'risk', 'support'],
  // STR / risk flags — risk desk (ADMIN_TEAM_RBAC_CANON §2: owner · risk)
  'queues.str.manage': ['owner', 'risk'],
  'queues.risk.clear': ['owner', 'risk'],
  'operations.kill_switch': ['owner', 'finance', 'risk', 'operator'],
  'users.moderate': ['owner', 'risk', 'support'],
  'users.wallet_adjust': ['owner', 'finance'],
  'users.tier.write': ['owner'],
  'casino.manage': ['owner', 'operator'],
  'earn.settlement.approve': ['owner', 'finance'],
  'access.rbac.manage': ['owner'],
  'alerts.manage': ['owner', 'risk', 'operator', 'support'],
  'support.tickets.resolve': ['owner', 'support'],
};

type DevEnv = { DEV?: boolean };

export function isAdminRbacDevPreviewEnabled(env: DevEnv = import.meta.env): boolean {
  return env.DEV === true;
}

export function adminRbacRoleLabelKey(role: AdminRbacRole): string {
  return `admin.access.role.${role}.label`;
}

export function isAdminRbacRole(value: string): value is AdminRbacRole {
  return (ADMIN_RBAC_ROLES as string[]).includes(value);
}

/** Highest-rank role; empty → viewer (fail-closed). */
export function resolvePrimaryAdminRole(roles: AdminRbacRole[]): AdminRbacRole {
  if (roles.length === 0) return ADMIN_RBAC_FAIL_CLOSED_ROLE;
  return roles.reduce((best, role) => (ROLE_RANK[role] > ROLE_RANK[best] ? role : best));
}

/**
 * Resolve UI role from `rpc_admin_list_role_grants` rows for the signed-in user.
 * Mirrors `_admin_has_role` bootstrap: admin with zero grant rows → owner.
 * Enabled grants empty → viewer (fail-closed).
 */
export function resolveOperatorRoleFromGrants(
  grants: readonly AdminRoleGrantRow[],
  userId: string | null | undefined,
): AdminRbacRole {
  if (!userId) return ADMIN_RBAC_FAIL_CLOSED_ROLE;
  const mine = grants.filter((g) => g.userId === userId);
  if (mine.length === 0) return 'owner';
  const enabled = mine.filter((g) => g.enabled).map((g) => g.role);
  return resolvePrimaryAdminRole(enabled);
}

export function canPerformAdminAction(role: AdminRbacRole, action: AdminRbacAction): boolean {
  if (role === 'owner') return true;
  return PERMISSIONS[action].includes(role);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Parse `rpc_admin_list_role_grants` JSON payload into typed grant rows. */
export function parseAdminRoleGrants(data: unknown): AdminRoleGrantRow[] {
  if (!isRecord(data) || !Array.isArray(data['grants'])) return [];
  const rows: AdminRoleGrantRow[] = [];
  for (const raw of data['grants']) {
    if (!isRecord(raw)) continue;
    const userId = typeof raw['user_id'] === 'string' ? raw['user_id'] : null;
    const roleRaw = typeof raw['role'] === 'string' ? raw['role'] : null;
    if (!userId || !roleRaw || !isAdminRbacRole(roleRaw)) continue;
    rows.push({
      userId,
      role: roleRaw,
      enabled: raw['enabled'] !== false,
    });
  }
  return rows;
}

/** DEV-only localStorage preview. Production always returns null (ignore stored owner). */
export function readStoredOperatorRole(options: { env?: DevEnv } = {}): AdminRbacRole | null {
  if (!isAdminRbacDevPreviewEnabled(options.env ?? import.meta.env)) return null;
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_OPERATOR_ROLE_STORAGE_KEY);
    if (raw && isAdminRbacRole(raw)) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

/** DEV-only write. Production no-op — cannot elevate via localStorage. */
export function writeStoredOperatorRole(
  role: AdminRbacRole,
  options: { env?: DevEnv } = {},
): boolean {
  if (!isAdminRbacDevPreviewEnabled(options.env ?? import.meta.env)) return false;
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(ADMIN_OPERATOR_ROLE_STORAGE_KEY, role);
    return true;
  } catch {
    return false;
  }
}
