import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  assertEwE10GrowthUiSync,
  EW_E10_GROWTH_UI_ARTIFACT_PATHS,
  EW_E10_GROWTH_UI_NEXT_TODO,
  EW_E10_GROWTH_UI_PREREQUISITE_TODO,
  EW_E10_GROWTH_UI_TEST_PATHS,
  EW_E10_GROWTH_UI_TODO,
  isEwE10GrowthUiUnlocked,
  isKakaoShareAugmentReady,
  isKakaoShareSdkLive,
} from '../ew-e10-growth-ui-display-contract';
import { resolveEwE9GateUiUnlockWireStatus } from '../ew-e9-gate-identity-support-display-contract';
import { isAppInstallMissionHubLive } from '../app-install-mission-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

describe('ew-e10-growth-ui-display-contract', () => {
  it('pins todo · prerequisite · next · live unlock', () => {
    expect(EW_E10_GROWTH_UI_TODO).toBe('ew-e10-growth-ui');
    expect(EW_E10_GROWTH_UI_PREREQUISITE_TODO).toBe('ew-e10-trust-support-ui');
    expect(EW_E10_GROWTH_UI_NEXT_TODO).toBe('ew-e10-gate-platform-world-class');
    expect(LAUNCH_GATES.appInstallMissionLive).toBe(true);
    expect(LAUNCH_GATES.kakaoShareSdkLive).toBe(true);
    expect(isKakaoShareSdkLive()).toBe(true);
    expect(isAppInstallMissionHubLive()).toBe(true);
    expect(isEwE10GrowthUiUnlocked()).toBe(true);
    expect(() => assertEwE10GrowthUiSync()).not.toThrow();
  });

  it('wires app-install growth tab live', () => {
    const wire = resolveEwE9GateUiUnlockWireStatus();
    expect(wire.app_install_mission_tab).toBe('live');
    expect(typeof isKakaoShareAugmentReady()).toBe('boolean');
  });

  it('requires artifacts on disk', () => {
    for (const rel of EW_E10_GROWTH_UI_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readFileSync(resolve(REPO_ROOT, rel), 'utf8').length).toBeGreaterThan(40);
    }
    for (const rel of EW_E10_GROWTH_UI_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });
});
