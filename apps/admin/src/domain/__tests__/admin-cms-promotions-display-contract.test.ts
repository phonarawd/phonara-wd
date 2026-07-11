import { describe, expect, it } from 'vitest';

import {
  ADMIN_CMS_LIST_RPC,
  ADMIN_CMS_PROMOTIONS_ENGINE_READY,
  ADMIN_CMS_PROMOTIONS_GATE_TODO,
  ADMIN_CMS_PROMOTIONS_TODO,
  ADMIN_CMS_PROMOTIONS_UI_UNLOCKED,
  ADMIN_CMS_PUBLISH_SCHEDULED_RPC,
  ADMIN_CMS_ROUTE,
  ADMIN_CMS_TARGETING_COLUMNS,
  ADMIN_CMS_UPSERT_RPC,
  ADMIN_PROMOTIONS_ROUTE,
  assertAdminCmsPromotionsUnlock,
} from '../admin-cms-promotions-display-contract';

describe('admin-cms-promotions-display-contract (E3 GATE unlock)', () => {
  it('pins CMS/promotions RPCs · targeting · GATE unlock', () => {
    expect(ADMIN_CMS_PROMOTIONS_TODO).toBe('ew-e3-viral-cms-wave');
    expect(ADMIN_CMS_PROMOTIONS_GATE_TODO).toBe('ew-e3-gate-cms-promotions');
    expect(ADMIN_CMS_LIST_RPC).toBe('rpc_admin_list_cms_content');
    expect(ADMIN_CMS_UPSERT_RPC).toBe('rpc_admin_upsert_cms_content');
    expect(ADMIN_CMS_PUBLISH_SCHEDULED_RPC).toBe('rpc_run_cms_publish_scheduled');
    expect(ADMIN_CMS_ROUTE).toBe('/admin/cms');
    expect(ADMIN_PROMOTIONS_ROUTE).toBe('/admin/promotions');
    expect(ADMIN_CMS_TARGETING_COLUMNS).toHaveLength(4);
    expect(ADMIN_CMS_PROMOTIONS_ENGINE_READY).toBe(true);
    expect(ADMIN_CMS_PROMOTIONS_UI_UNLOCKED).toBe(true);
    expect(() => assertAdminCmsPromotionsUnlock()).not.toThrow();
  });
});
