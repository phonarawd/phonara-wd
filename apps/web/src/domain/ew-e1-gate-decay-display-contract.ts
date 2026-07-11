/**
 * E1 Decay GATE pin (YAML #241).
 * Authority: Plan `ew-e1-gate-decay` · ADR-010 · `/tier/me` full unlock.
 *
 * GATE does not re-ship decay RPC — asserts wave green · remote apply ·
 * advisor 0 · `/tier/me` live status wire · launch gate unlock.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  TIER_DECAY_ARTIFACT_PATHS,
  TIER_DECAY_MIGRATION_NAME,
  TIER_DECAY_NEXT_TODO,
  TIER_DECAY_RUN_RPC,
  TIER_DECAY_STATUS_RPC,
  TIER_DECAY_TODO,
  TIER_DECAY_WARNING_EVENT,
  assertTierDecayWaveSync,
} from './tier-decay-display-contract';
import { TIER_ME_ROUTE, TIER_DECAY_STATUS_RPC as TIER_ME_DECAY_STATUS_RPC } from './tier-me-display-contract';
import { isTierKeepStatusClaimEngineLive } from './dead-controls-display-contract';

export const EW_E1_GATE_DECAY_TODO = 'ew-e1-gate-decay' as const;
export const EW_E1_GATE_DECAY_PREREQUISITE_TODO = TIER_DECAY_TODO;
export const EW_E1_GATE_DECAY_NEXT_TODO = 'ew-e2-missions-wave' as const;

export const EW_E1_GATE_DECAY_UNLOCK_ROUTE = TIER_ME_ROUTE;

export const EW_E1_GATE_DECAY_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e1-gate-decay-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e1-gate-decay-display-contract.test.ts',
  'apps/web/src/domain/tier-decay-display-contract.ts',
  'apps/web/src/domain/tier-me-display-contract.ts',
  'apps/web/src/features/earn/use-tier-me-page-controller.ts',
  'apps/web/src/product/surfaces/tier/tier-me-page.tsx',
  'apps/web/src/lib/launch-gates.ts',
  'docs/PRODUCT/ADR/010-tier-decay.md',
  'docs/OPERATIONS/ENGINE_GAP_E1_GATE_DECAY.md',
  'supabase/migrations/20260801000001_ew_e1_tier_decay.sql',
  'supabase/tests/ew_e1_tier_decay_test.sql',
] as const;

export const EW_E1_GATE_DECAY_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e1-gate-decay-display-contract.test.ts',
  'apps/web/src/domain/__tests__/tier-decay-display-contract.test.ts',
  'apps/web/src/domain/__tests__/tier-me-display-contract.test.ts',
  'apps/web/src/domain/__tests__/dead-controls-display-contract.test.ts',
  'apps/web/src/features/earn/__tests__/use-tier-me-page-controller.test.ts',
  'apps/web/src/product/surfaces/tier/__tests__/tier-me-page.test.tsx',
] as const;

/** Remote migration name parity (Management API timestamp may differ). */
export const EW_E1_GATE_DECAY_REMOTE_MIGRATION_NAME = TIER_DECAY_MIGRATION_NAME;

export function isTierMeDecayFullUnlocked(): boolean {
  return (
    LAUNCH_GATES.tierDecayEngine === true &&
    isTierKeepStatusClaimEngineLive() &&
    TIER_ME_DECAY_STATUS_RPC === TIER_DECAY_STATUS_RPC
  );
}

export function assertEwE1GateDecaySync(): void {
  assertTierDecayWaveSync();

  if (EW_E1_GATE_DECAY_TODO !== 'ew-e1-gate-decay') {
    throw new Error('E1 GATE todo id drift');
  }
  if (EW_E1_GATE_DECAY_PREREQUISITE_TODO !== 'ew-e1-decay-wave') {
    throw new Error('E1 GATE prerequisite must be ew-e1-decay-wave');
  }
  if (EW_E1_GATE_DECAY_NEXT_TODO !== 'ew-e2-missions-wave') {
    throw new Error('E1 GATE next must be ew-e2-missions-wave');
  }
  if (TIER_DECAY_NEXT_TODO !== 'ew-e1-gate-decay') {
    throw new Error('E1 WAVE next must unlock ew-e1-gate-decay');
  }
  if (EW_E1_GATE_DECAY_UNLOCK_ROUTE !== '/tier/me') {
    throw new Error('E1 GATE unlock route must be /tier/me');
  }
  if (TIER_DECAY_RUN_RPC !== 'rpc_run_tier_decay') {
    throw new Error('E1 GATE run RPC drift');
  }
  if (TIER_DECAY_STATUS_RPC !== 'rpc_get_tier_decay_status') {
    throw new Error('E1 GATE status RPC drift');
  }
  if (TIER_DECAY_WARNING_EVENT !== 'tier_decay_warning') {
    throw new Error('E1 GATE warning event drift');
  }
  if (!isTierMeDecayFullUnlocked()) {
    throw new Error('E1 GATE /tier/me full unlock not live');
  }
  if (TIER_DECAY_ARTIFACT_PATHS.length < 5) {
    throw new Error('E1 WAVE artifacts missing');
  }
}
