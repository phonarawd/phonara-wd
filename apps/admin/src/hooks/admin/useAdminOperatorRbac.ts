import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  type AdminRbacAction,
  type AdminRbacRole,
  ADMIN_OPERATOR_ROLE_STORAGE_KEY,
  ADMIN_RBAC_FAIL_CLOSED_ROLE,
  adminRbacRoleLabelKey,
  canPerformAdminAction,
  isAdminRbacDevPreviewEnabled,
  parseAdminRoleGrants,
  readStoredOperatorRole,
  resolveOperatorRoleFromGrants,
  writeStoredOperatorRole,
} from '@/domain/admin-rbac';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

const ROLE_CHANGE_EVENT = 'phonara-admin-operator-role-change';

function notifyRoleChange(): void {
  window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
}

/**
 * Active operator role for UI gating.
 * Authority: `rpc_admin_list_role_grants` (fail-closed while loading/error).
 * localStorage role preview is DEV-only — production cannot elevate via storage.
 */
export function useAdminOperatorRbac() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const previewEnabled = isAdminRbacDevPreviewEnabled();

  const grantsQuery = useQuery({
    queryKey: ['admin', 'operator-rbac', 'role-grants', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_admin_list_role_grants');
      if (error) throw error;
      return parseAdminRoleGrants(data);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const serverRole = useMemo((): AdminRbacRole => {
    if (!userId || !grantsQuery.isSuccess) return ADMIN_RBAC_FAIL_CLOSED_ROLE;
    return resolveOperatorRoleFromGrants(grantsQuery.data, userId);
  }, [userId, grantsQuery.isSuccess, grantsQuery.data]);

  const [previewRole, setPreviewRoleState] = useState<AdminRbacRole | null>(() =>
    previewEnabled ? readStoredOperatorRole() : null,
  );

  useEffect(() => {
    if (!previewEnabled) {
      setPreviewRoleState(null);
      return;
    }
    const sync = () => setPreviewRoleState(readStoredOperatorRole());
    window.addEventListener(ROLE_CHANGE_EVENT, sync);
    const onStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_OPERATOR_ROLE_STORAGE_KEY) sync();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ROLE_CHANGE_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, [previewEnabled]);

  const role: AdminRbacRole =
    previewEnabled && previewRole != null ? previewRole : serverRole;

  const can = useCallback(
    (action: AdminRbacAction) => canPerformAdminAction(role, action),
    [role],
  );

  const setPreviewRole = useCallback(
    (next: AdminRbacRole) => {
      if (!isAdminRbacDevPreviewEnabled()) return;
      writeStoredOperatorRole(next);
      setPreviewRoleState(next);
      notifyRoleChange();
    },
    [],
  );

  return {
    role,
    serverRole,
    can,
    setPreviewRole,
    previewEnabled,
    grantsStatus: grantsQuery.status,
    roleLabelKey: adminRbacRoleLabelKey(role),
  };
}

export type { AdminRbacAction, AdminRbacRole };
