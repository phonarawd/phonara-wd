import type { MessageKey } from '@phonara/i18n';

import type { AdminRbacAction } from '@/hooks/admin/useAdminOperatorRbac';

/** Shared props for high-risk admin buttons gated by client RBAC preview. */
export function adminRbacActionProps(
  allowed: boolean,
  deniedTitle: string,
): { disabled: boolean; title: string | undefined; 'aria-disabled': boolean } {
  return {
    disabled: !allowed,
    title: allowed ? undefined : deniedTitle,
    'aria-disabled': !allowed,
  };
}

export type HighRiskAdminAction = Extract<
  AdminRbacAction,
  | 'queues.withdraw.approve'
  | 'queues.withdraw.reject'
  | 'queues.kyc.review'
  | 'operations.kill_switch'
  | 'users.wallet_adjust'
>;

export const ADMIN_RBAC_DENIED_KEY = 'admin.rbac.denied' satisfies MessageKey;
