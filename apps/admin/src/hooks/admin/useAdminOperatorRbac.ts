import { useCallback, useEffect, useState } from 'react';
import {
  type AdminRbacAction,
  type AdminRbacRole,
  adminRbacRoleLabelKey,
  canPerformAdminAction,
  readStoredOperatorRole,
  writeStoredOperatorRole,
  ADMIN_OPERATOR_ROLE_STORAGE_KEY,
} from '@/domain/admin-rbac';

const ROLE_CHANGE_EVENT = 'phonara-admin-operator-role-change';

function notifyRoleChange(): void {
  window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
}

/** Active operator role for UI gating — defaults owner (1-person ops); preview via localStorage. */
export function useAdminOperatorRbac() {
  const [role, setRole] = useState<AdminRbacRole>(() => readStoredOperatorRole());

  useEffect(() => {
    const sync = () => setRole(readStoredOperatorRole());
    window.addEventListener(ROLE_CHANGE_EVENT, sync);
    const onStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_OPERATOR_ROLE_STORAGE_KEY) sync();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ROLE_CHANGE_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const can = useCallback((action: AdminRbacAction) => canPerformAdminAction(role, action), [role]);

  const setPreviewRole = useCallback((next: AdminRbacRole) => {
    writeStoredOperatorRole(next);
    setRole(next);
    notifyRoleChange();
  }, []);

  return {
    role,
    can,
    setPreviewRole,
    roleLabelKey: adminRbacRoleLabelKey(role),
  };
}

export type { AdminRbacAction, AdminRbacRole };
