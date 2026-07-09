/** Client-side RBAC matrix — server RPC/RLS remains authoritative. */

export type AdminRbacRole = 'owner' | 'finance' | 'risk' | 'support' | 'operator' | 'viewer';

export type AdminRbacAction =
  | 'queues.withdraw.approve'
  | 'queues.withdraw.reject'
  | 'queues.kyc.review'
  | 'operations.kill_switch'
  | 'users.moderate'
  | 'users.wallet_adjust'
  | 'casino.manage'
  | 'earn.settlement.approve'
  | 'access.rbac.manage'
  | 'alerts.manage';

export const ADMIN_RBAC_ROLES: AdminRbacRole[] = [
  'owner',
  'finance',
  'risk',
  'support',
  'operator',
  'viewer',
];

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
  'operations.kill_switch': ['owner', 'finance', 'risk', 'operator'],
  'users.moderate': ['owner', 'risk', 'support'],
  'users.wallet_adjust': ['owner', 'finance'],
  'casino.manage': ['owner', 'operator'],
  'earn.settlement.approve': ['owner', 'finance'],
  'access.rbac.manage': ['owner'],
  'alerts.manage': ['owner', 'risk', 'operator', 'support'],
};

export function adminRbacRoleLabelKey(role: AdminRbacRole): string {
  return `admin.access.role.${role}.label`;
}

export function isAdminRbacRole(value: string): value is AdminRbacRole {
  return (ADMIN_RBAC_ROLES as string[]).includes(value);
}

export function resolvePrimaryAdminRole(roles: AdminRbacRole[]): AdminRbacRole {
  if (roles.length === 0) return 'owner';
  return roles.reduce((best, role) => (ROLE_RANK[role] > ROLE_RANK[best] ? role : best));
}

export function canPerformAdminAction(role: AdminRbacRole, action: AdminRbacAction): boolean {
  if (role === 'owner') return true;
  return PERMISSIONS[action].includes(role);
}

export function readStoredOperatorRole(): AdminRbacRole {
  if (typeof window === 'undefined') return 'owner';
  try {
    const raw = window.localStorage.getItem(ADMIN_OPERATOR_ROLE_STORAGE_KEY);
    if (raw && isAdminRbacRole(raw)) return raw;
  } catch {
    /* ignore */
  }
  return 'owner';
}

export function writeStoredOperatorRole(role: AdminRbacRole): void {
  window.localStorage.setItem(ADMIN_OPERATOR_ROLE_STORAGE_KEY, role);
}
