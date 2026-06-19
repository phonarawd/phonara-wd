/** Tier C admin surfaces — no client RPC yet; block mutation affordances in production UI. */
export const ADMIN_WIRE_TIER_C_DISABLED = true;

export function tierCDisabledTitle(t: (key: string) => string): string {
  return t('admin.wire.disabledNoRpc');
}
