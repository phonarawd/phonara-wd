import { describe, expect, it } from 'vitest';

import { ADMIN_OPS_PUSH_SW_PATH } from '@/domain/admin-ops-push-display-contract';
import { resolveAdminOpsPushSupported } from '@/features/ops-push/admin-ops-web-push';

describe('admin-ops-web-push', () => {
  it('reports unsupported outside a browser PushManager environment', () => {
    expect(resolveAdminOpsPushSupported()).toBe(false);
  });

  it('pins admin SW path for registration', () => {
    expect(ADMIN_OPS_PUSH_SW_PATH).toBe('/sw.js');
  });
});
