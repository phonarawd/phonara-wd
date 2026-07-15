import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  APP_INSTALL_MISSION_UI_ID,
  APP_INSTALL_VIRAL_RPC,
  isAppInstallMissionHubLive,
  parseAppInstallAttributionResult,
  shouldDeferAppInstallMissionRow,
} from '../app-install-mission-display-contract';

describe('app-install-mission-display-contract', () => {
  it('pins growth tab mission id and live unlock', () => {
    expect(APP_INSTALL_MISSION_UI_ID).toBe('growth-appInstall');
    expect(APP_INSTALL_VIRAL_RPC).toBe('app_install');
    expect(LAUNCH_GATES.appInstallMissionLive).toBe(true);
    expect(isAppInstallMissionHubLive()).toBe(true);
    expect(shouldDeferAppInstallMissionRow('growth-appInstall')).toBe(false);
    expect(shouldDeferAppInstallMissionRow('viral-shareLink')).toBe(false);
  });

  it('parses attribution RPC payload', () => {
    expect(
      parseAppInstallAttributionResult({
        ok: true,
        granted: true,
        idempotent: false,
        attribution_id: 'attr-1',
      }),
    ).toEqual({
      ok: true,
      granted: true,
      idempotent: false,
      attributionId: 'attr-1',
    });
  });
});
