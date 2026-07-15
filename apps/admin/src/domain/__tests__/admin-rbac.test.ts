import { afterEach, describe, expect, it } from 'vitest';
import {
  ADMIN_OPERATOR_ROLE_STORAGE_KEY,
  ADMIN_RBAC_FAIL_CLOSED_ROLE,
  ADMIN_RBAC_ROLES,
  canPerformAdminAction,
  isAdminRbacDevPreviewEnabled,
  parseAdminRoleGrants,
  readStoredOperatorRole,
  resolveOperatorRoleFromGrants,
  resolvePrimaryAdminRole,
  writeStoredOperatorRole,
} from '@/domain/admin-rbac';

describe('admin-rbac permission matrix', () => {
  it('defines six team roles', () => {
    expect(ADMIN_RBAC_ROLES).toEqual(['owner', 'finance', 'risk', 'support', 'operator', 'viewer']);
  });

  it('owner can perform all gated actions', () => {
    expect(canPerformAdminAction('owner', 'queues.withdraw.approve')).toBe(true);
    expect(canPerformAdminAction('owner', 'access.rbac.manage')).toBe(true);
    expect(canPerformAdminAction('owner', 'operations.kill_switch')).toBe(true);
    expect(canPerformAdminAction('owner', 'support.tickets.resolve')).toBe(true);
  });

  it('viewer cannot approve withdrawals or toggle kill switches', () => {
    expect(canPerformAdminAction('viewer', 'queues.withdraw.approve')).toBe(false);
    expect(canPerformAdminAction('viewer', 'operations.kill_switch')).toBe(false);
    expect(canPerformAdminAction('viewer', 'support.tickets.resolve')).toBe(false);
  });

  it('support can resolve tickets · finance cannot', () => {
    expect(canPerformAdminAction('support', 'support.tickets.resolve')).toBe(true);
    expect(canPerformAdminAction('finance', 'support.tickets.resolve')).toBe(false);
  });

  it('finance can approve settlements · viewer cannot', () => {
    expect(canPerformAdminAction('finance', 'earn.settlement.approve')).toBe(true);
    expect(canPerformAdminAction('viewer', 'earn.settlement.approve')).toBe(false);
    expect(canPerformAdminAction('owner', 'users.tier.write')).toBe(true);
    expect(canPerformAdminAction('finance', 'users.tier.write')).toBe(false);
  });

  it('finance can approve withdrawals but not manage RBAC grants', () => {
    expect(canPerformAdminAction('finance', 'queues.withdraw.approve')).toBe(true);
    expect(canPerformAdminAction('finance', 'access.rbac.manage')).toBe(false);
  });

  it('risk can review KYC but not wallet adjustments', () => {
    expect(canPerformAdminAction('risk', 'queues.kyc.review')).toBe(true);
    expect(canPerformAdminAction('risk', 'users.wallet_adjust')).toBe(false);
  });

  it('resolvePrimaryAdminRole picks highest rank', () => {
    expect(resolvePrimaryAdminRole(['viewer', 'finance'])).toBe('finance');
    expect(resolvePrimaryAdminRole(['support', 'operator'])).toBe('operator');
  });

  it('resolvePrimaryAdminRole empty is fail-closed viewer', () => {
    expect(resolvePrimaryAdminRole([])).toBe(ADMIN_RBAC_FAIL_CLOSED_ROLE);
    expect(resolvePrimaryAdminRole([])).toBe('viewer');
  });
});

describe('admin-rbac grants resolution (rpc_admin_list_role_grants)', () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  it('parseAdminRoleGrants reads enabled grants', () => {
    expect(
      parseAdminRoleGrants({
        grants: [
          { user_id: userId, role: 'finance', enabled: true },
          { user_id: 'other', role: 'not-a-role', enabled: true },
          { user_id: userId, role: 'viewer', enabled: false },
        ],
      }),
    ).toEqual([
      { userId, role: 'finance', enabled: true },
      { userId, role: 'viewer', enabled: false },
    ]);
  });

  it('parseAdminRoleGrants returns [] on malformed payload', () => {
    expect(parseAdminRoleGrants(null)).toEqual([]);
    expect(parseAdminRoleGrants({})).toEqual([]);
    expect(parseAdminRoleGrants({ grants: 'nope' })).toEqual([]);
  });

  it('missing userId is fail-closed viewer', () => {
    expect(resolveOperatorRoleFromGrants([], null)).toBe('viewer');
    expect(resolveOperatorRoleFromGrants([], undefined)).toBe('viewer');
  });

  it('zero grant rows for user bootstraps owner (mirrors _admin_has_role)', () => {
    expect(resolveOperatorRoleFromGrants([], userId)).toBe('owner');
    expect(
      resolveOperatorRoleFromGrants([{ userId: 'other', role: 'finance', enabled: true }], userId),
    ).toBe('owner');
  });

  it('enabled grant row becomes primary role', () => {
    expect(
      resolveOperatorRoleFromGrants([{ userId, role: 'finance', enabled: true }], userId),
    ).toBe('finance');
  });

  it('disabled-only grants are fail-closed viewer', () => {
    expect(resolveOperatorRoleFromGrants([{ userId, role: 'owner', enabled: false }], userId)).toBe(
      'viewer',
    );
  });
});

describe('admin-rbac localStorage DEV-only preview', () => {
  afterEach(() => {
    try {
      window.localStorage.removeItem(ADMIN_OPERATOR_ROLE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  });

  it('isAdminRbacDevPreviewEnabled follows env.DEV', () => {
    expect(isAdminRbacDevPreviewEnabled({ DEV: true })).toBe(true);
    expect(isAdminRbacDevPreviewEnabled({ DEV: false })).toBe(false);
    expect(isAdminRbacDevPreviewEnabled({})).toBe(false);
  });

  it('production env ignores stored owner and refuses write', () => {
    window.localStorage.setItem(ADMIN_OPERATOR_ROLE_STORAGE_KEY, 'owner');
    expect(readStoredOperatorRole({ env: { DEV: false } })).toBeNull();
    expect(writeStoredOperatorRole('owner', { env: { DEV: false } })).toBe(false);
    // Stale key must not elevate when read under prod env
    expect(readStoredOperatorRole({ env: { DEV: false } })).toBeNull();
  });

  it('DEV env can read/write preview role', () => {
    expect(writeStoredOperatorRole('finance', { env: { DEV: true } })).toBe(true);
    expect(readStoredOperatorRole({ env: { DEV: true } })).toBe('finance');
  });

  it('DEV env rejects invalid stored role', () => {
    window.localStorage.setItem(ADMIN_OPERATOR_ROLE_STORAGE_KEY, 'superadmin');
    expect(readStoredOperatorRole({ env: { DEV: true } })).toBeNull();
  });
});
