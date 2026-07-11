/**
 * E10 Platform World-Class GATE pin (YAML `ew-e10-gate-platform-world-class`).
 * Authority: Plan §21.4 · §32.2 · ENGINE_GAP_ADR E8–E10 final gate.
 *
 * Asserts E8–E10 engine remote-ready · UI linear chain unlocked · §12.18 gap 0
 * (ad/survey excluded) · §32 narrative canon wired. Remote apply = this GATE.
 */

import {
  ENGINE_GAP_ADR_PATH,
  ENGINE_GAP_PERMANENT_EXCLUSIONS,
} from './engine-gap-adr-display-contract';
import {
  assertEwE8GateFinancialSync,
  EW_E8_GATE_FINANCIAL_REMOTE_MIGRATION_NAME,
  EW_E8_GATE_FINANCIAL_REMOTE_TAIL,
  EW_E8_GATE_FINANCIAL_SQL_TEST,
  EW_E8_GATE_FINANCIAL_TODO,
  isEwE8FinancialGateReady,
} from './ew-e8-gate-financial-display-contract';
import {
  assertEwE9GateIdentitySync,
  EW_E9_GATE_APP_INSTALL_ENUM_REMOTE_MIGRATION_NAME,
  EW_E9_GATE_APP_INSTALL_ENUM_REMOTE_TAIL,
  EW_E9_GATE_IDENTITY_REMOTE_MIGRATION_NAME,
  EW_E9_GATE_IDENTITY_REMOTE_TAIL,
  EW_E9_GATE_IDENTITY_SQL_TEST,
  EW_E9_GATE_IDENTITY_TODO,
  isEwE9IdentityGateReady,
} from './ew-e9-gate-identity-support-display-contract';
import {
  assertEwE10GrowthUiSync,
  EW_E10_GROWTH_UI_PREREQUISITE_TODO,
  EW_E10_GROWTH_UI_TODO,
  isEwE10GrowthUiUnlocked,
} from './ew-e10-growth-ui-display-contract';
import {
  assertEwE10PlatformWaveSync,
  EW_E10_AD_SURVEY_MISSIONS_FORBIDDEN,
  EW_E10_PLATFORM_MIGRATION_NAME,
  isEwE10PlatformEngineReady,
} from './ew-e10-platform-engine-display-contract';
import {
  assertEwE10TrustSupportUiSync,
  EW_E10_TRUST_SUPPORT_UI_TODO,
  isEwE10TrustSupportUiUnlocked,
} from './ew-e10-trust-support-ui-display-contract';
import {
  assertEwE10WalletSettingsUiSync,
  EW_E10_WALLET_SETTINGS_UI_TODO,
  isEwE10WalletSettingsUiUnlocked,
} from './ew-e10-wallet-settings-ui-display-contract';
import { listPlatformNarrativeMessageKeys } from './platform-narrative-display-contract';

export const EW_E10_PLATFORM_WORLD_CLASS_GATE_TODO = 'ew-e10-gate-platform-world-class' as const;
export const EW_E10_PLATFORM_WORLD_CLASS_GATE_PREREQUISITE_TODO = EW_E10_GROWTH_UI_TODO;
/** E8–E10 Platform World-Class ladder terminal — Track A P13 closeout is sibling gate. */
export const EW_E10_PLATFORM_WORLD_CLASS_GATE_NEXT_TODO = 'p13-closeout-bundle' as const;

export const EW_E10_PLATFORM_WORLD_CLASS_GATE_SQL_TESTS = [
  EW_E8_GATE_FINANCIAL_SQL_TEST,
  EW_E9_GATE_IDENTITY_SQL_TEST,
  'supabase/tests/ew_e10_platform_engine_test.sql',
] as const;

export const EW_E10_PLATFORM_WORLD_CLASS_REMOTE_MIGRATIONS = [
  { name: EW_E8_GATE_FINANCIAL_REMOTE_MIGRATION_NAME, tail: EW_E8_GATE_FINANCIAL_REMOTE_TAIL },
  {
    name: EW_E9_GATE_APP_INSTALL_ENUM_REMOTE_MIGRATION_NAME,
    tail: EW_E9_GATE_APP_INSTALL_ENUM_REMOTE_TAIL,
  },
  {
    name: EW_E9_GATE_IDENTITY_REMOTE_MIGRATION_NAME,
    tail: EW_E9_GATE_IDENTITY_REMOTE_TAIL,
  },
  { name: EW_E10_PLATFORM_MIGRATION_NAME, tail: '20260711225356_ew_e10_platform_engine' as const },
] as const;

/** §12.18 E8–E10 scope — ad/survey = permanent_skip only. */
export const EW_E10_PLATFORM_WORLD_CLASS_GAP_REGISTER = [
  { id: 'p2p_transfer', wave: 'E8', status: 'ui_live' as const },
  { id: 'trading_api_keys', wave: 'E8', status: 'ui_live' as const },
  { id: 'giftcard_redeem_reverse', wave: 'E8', status: 'ui_live' as const },
  { id: 'siwe_login', wave: 'E9', status: 'engine_ready' as const },
  { id: 'support_tickets', wave: 'E9', status: 'ui_live' as const },
  { id: 'product_analytics', wave: 'E9', status: 'engine_ready' as const },
  { id: 'app_install_mission', wave: 'E9', status: 'ui_live' as const },
  { id: 'tier_leaderboard', wave: 'E9', status: 'ui_live' as const },
  { id: 'krw_deposit_proof', wave: 'E10', status: 'engine_ready' as const },
  { id: 'mission_chains', wave: 'E10', status: 'engine_ready' as const },
  { id: 'co_bet', wave: 'E10', status: 'engine_ready' as const },
  { id: 'ml_mission_recommend', wave: 'E10', status: 'engine_ready' as const },
  { id: 'kakao_share_sdk', wave: 'E10', status: 'ui_live' as const },
  { id: 'system_status', wave: 'E10', status: 'ui_live' as const },
  { id: 'ad_watch_mission', wave: 'exclude', status: 'permanent_skip' as const },
  { id: 'survey_mission', wave: 'exclude', status: 'permanent_skip' as const },
] as const;

/** §32.1 narrative & trust canon paths (engine 0 · display contracts). */
export const EW_E10_PLATFORM_WORLD_CLASS_SECTION32_CANON_PATHS = [
  'docs/SSOT/PLATFORM_NARRATIVE_CANON.md',
  'docs/SSOT/ONBOARDING_JOURNEY_CANON.md',
  'docs/SSOT/GLOBAL_EXPANSION.md',
  ENGINE_GAP_ADR_PATH,
  'apps/web/src/domain/platform-narrative-display-contract.ts',
  'apps/web/src/domain/onboarding-journey-display-contract.ts',
] as const;

export const EW_E10_PLATFORM_WORLD_CLASS_GATE_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e10-gate-platform-world-class-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e10-gate-platform-world-class-display-contract.test.ts',
  'apps/web/src/domain/ew-e8-gate-financial-display-contract.ts',
  'apps/web/src/domain/ew-e9-gate-identity-support-display-contract.ts',
  'apps/web/src/domain/ew-e10-platform-engine-display-contract.ts',
  'apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts',
  'apps/web/src/domain/ew-e10-trust-support-ui-display-contract.ts',
  'apps/web/src/domain/ew-e10-growth-ui-display-contract.ts',
  'docs/OPERATIONS/ENGINE_GAP_E10_GATE_PLATFORM_WORLD_CLASS.md',
  'docs/PRODUCT/ADR/020-platform-engine.md',
  'docs/PRODUCT/ADR/ENGINE_GAP_ADR.md',
  'supabase/migrations/20260811000001_ew_e8_financial.sql',
  'supabase/migrations/20260812000001_ew_e9_app_install_enum.sql',
  'supabase/migrations/20260812000002_ew_e9_identity_support.sql',
  'supabase/migrations/20260813000001_ew_e10_platform_engine.sql',
  ...EW_E10_PLATFORM_WORLD_CLASS_GATE_SQL_TESTS,
  ...EW_E10_PLATFORM_WORLD_CLASS_SECTION32_CANON_PATHS,
] as const;

export const EW_E10_PLATFORM_WORLD_CLASS_GATE_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e10-gate-platform-world-class-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e8-gate-financial-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e9-gate-identity-support-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e10-platform-engine-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e10-trust-support-ui-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e10-growth-ui-display-contract.test.ts',
  'apps/web/src/domain/__tests__/platform-narrative-display-contract.test.ts',
] as const;

export type EwE10PlatformWorldClassGapStatus = 'engine_ready' | 'ui_live' | 'permanent_skip';

function assertSection32CanonWired(): void {
  if (EW_E10_PLATFORM_WORLD_CLASS_SECTION32_CANON_PATHS.length < 6) {
    throw new Error('§32 canon path registry under-registered');
  }
  if (listPlatformNarrativeMessageKeys().length < 8) {
    throw new Error('§32 platform narrative keys under-registered');
  }
}

function assertSection1218GapRegisterClosed(): void {
  for (const row of EW_E10_PLATFORM_WORLD_CLASS_GAP_REGISTER) {
    const status = row.status as EwE10PlatformWorldClassGapStatus;
    if (status === 'permanent_skip') {
      continue;
    }
    if (status !== 'engine_ready' && status !== 'ui_live') {
      throw new Error(`§12.18 gap ${row.id} unresolved`);
    }
  }
  if (!ENGINE_GAP_PERMANENT_EXCLUSIONS.includes('ad_watch_mission')) {
    throw new Error('§12.18 ad_watch permanent exclusion drift');
  }
  if (!ENGINE_GAP_PERMANENT_EXCLUSIONS.includes('survey_mission')) {
    throw new Error('§12.18 survey permanent exclusion drift');
  }
  if (EW_E10_AD_SURVEY_MISSIONS_FORBIDDEN !== true) {
    throw new Error('E10 ad/survey missions must stay forbidden');
  }
}

/** Platform World-Class GATE ready — E8–E10 engine + UI linear chain + §12.18 + §32. */
export function isEwE10PlatformWorldClassGateReady(): boolean {
  return (
    isEwE8FinancialGateReady() &&
    isEwE9IdentityGateReady() &&
    isEwE10PlatformEngineReady() &&
    isEwE10WalletSettingsUiUnlocked() &&
    isEwE10TrustSupportUiUnlocked() &&
    isEwE10GrowthUiUnlocked()
  );
}

export function assertEwE10PlatformWorldClassGateSync(): void {
  assertEwE8GateFinancialSync();
  assertEwE9GateIdentitySync();
  assertEwE10PlatformWaveSync();
  assertEwE10WalletSettingsUiSync();
  assertEwE10TrustSupportUiSync();
  assertEwE10GrowthUiSync();
  assertSection1218GapRegisterClosed();
  assertSection32CanonWired();

  if (EW_E10_PLATFORM_WORLD_CLASS_GATE_TODO !== 'ew-e10-gate-platform-world-class') {
    throw new Error('E10 Platform World-Class GATE todo id drift');
  }
  if (EW_E10_PLATFORM_WORLD_CLASS_GATE_PREREQUISITE_TODO !== 'ew-e10-growth-ui') {
    throw new Error('E10 GATE prerequisite must be ew-e10-growth-ui');
  }
  if (EW_E10_GROWTH_UI_PREREQUISITE_TODO !== EW_E10_TRUST_SUPPORT_UI_TODO) {
    throw new Error('E10 growth prerequisite chain drift');
  }
  if (EW_E10_WALLET_SETTINGS_UI_TODO !== 'ew-e10-wallet-settings-ui') {
    throw new Error('E10 wallet-settings todo drift');
  }
  if (EW_E8_GATE_FINANCIAL_TODO !== 'ew-e8-gate-financial') {
    throw new Error('E8 GATE todo drift');
  }
  if (EW_E9_GATE_IDENTITY_TODO !== 'ew-e9-gate-identity-support') {
    throw new Error('E9 GATE todo drift');
  }
  if (EW_E10_PLATFORM_WORLD_CLASS_GATE_SQL_TESTS.length !== 3) {
    throw new Error('E10 GATE must pin E8+E9+E10 SQL tests');
  }
  if (EW_E10_PLATFORM_WORLD_CLASS_REMOTE_MIGRATIONS.length !== 4) {
    throw new Error('E10 GATE must pin 4 remote migrations');
  }
  if (!isEwE10PlatformWorldClassGateReady()) {
    throw new Error('E10 Platform World-Class GATE not ready');
  }
}
