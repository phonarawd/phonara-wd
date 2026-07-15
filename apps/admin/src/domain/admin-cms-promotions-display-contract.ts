/**
 * Admin E3 CMS/promotions targeting path pin.
 * Engine: rpc_admin_list/upsert_cms_content + schedule publish + targeting columns.
 * Desk unlock = ew-e3-gate-cms-promotions (GATE live). Full desk UI = E6.
 */

export const ADMIN_CMS_PROMOTIONS_TODO = 'ew-e3-viral-cms-wave' as const;
export const ADMIN_CMS_PROMOTIONS_GATE_TODO = 'ew-e3-gate-cms-promotions' as const;
export const ADMIN_CMS_LIST_RPC = 'rpc_admin_list_cms_content' as const;
export const ADMIN_CMS_UPSERT_RPC = 'rpc_admin_upsert_cms_content' as const;
export const ADMIN_CMS_PUBLISH_SCHEDULED_RPC = 'rpc_run_cms_publish_scheduled' as const;

export const ADMIN_CMS_ROUTE = '/admin/cms' as const;
export const ADMIN_PROMOTIONS_ROUTE = '/admin/promotions' as const;

export const ADMIN_CMS_TARGETING_COLUMNS = [
  'audience',
  'min_tier',
  'max_tier',
  'schedule_publish_at',
] as const;

/** Engine targeting/schedule path ready after E3 WAVE. */
export const ADMIN_CMS_PROMOTIONS_ENGINE_READY = true as const;
/** GATE unlock — desks may consume targeting fields (full UI = E6). */
export const ADMIN_CMS_PROMOTIONS_UI_UNLOCKED = true as const;

export function assertAdminCmsPromotionsUnlock(): void {
  if (ADMIN_CMS_LIST_RPC !== 'rpc_admin_list_cms_content') {
    throw new Error('admin CMS list RPC drift');
  }
  if (ADMIN_CMS_UPSERT_RPC !== 'rpc_admin_upsert_cms_content') {
    throw new Error('admin CMS upsert RPC drift');
  }
  if (ADMIN_CMS_PUBLISH_SCHEDULED_RPC !== 'rpc_run_cms_publish_scheduled') {
    throw new Error('admin CMS schedule publish RPC drift');
  }
  if (ADMIN_CMS_TARGETING_COLUMNS.length !== 4) {
    throw new Error('admin CMS targeting columns must be 4');
  }
  if (ADMIN_CMS_PROMOTIONS_ENGINE_READY !== true) {
    throw new Error('admin CMS/promotions engine must be ready in E3 WAVE');
  }
  if (ADMIN_CMS_PROMOTIONS_UI_UNLOCKED !== true) {
    throw new Error('admin CMS/promotions UI must be unlocked after E3 GATE');
  }
  if (ADMIN_CMS_PROMOTIONS_GATE_TODO !== 'ew-e3-gate-cms-promotions') {
    throw new Error('admin CMS/promotions GATE todo drift');
  }
  if (ADMIN_CMS_ROUTE !== '/admin/cms') {
    throw new Error('admin CMS route drift');
  }
  if (ADMIN_PROMOTIONS_ROUTE !== '/admin/promotions') {
    throw new Error('admin promotions route drift');
  }
}
