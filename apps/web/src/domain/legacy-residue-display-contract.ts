/**

 * Phase 10 legacy residue inventory — rollback reserve vs active purge targets.

 * §7 money waves: physical delete at Canary Wave-4 (Default) per money-rollout-display-contract.

 */

import {
  getLegacyRollbackReserveFilesOnDisk,
  getMoneyWaveLegacyFilesPurgedAtWave4,
} from './money-rollout-display-contract';

/** Rollback reserve files still required on disk (non-money + money waves not yet Wave-4). */

export const LEGACY_ROLLBACK_RESERVE_FILES = getLegacyRollbackReserveFilesOnDisk();

/** Wave-4 purged legacy files — audit trail for closeout gates. */

export const LEGACY_WAVE4_PURGED_FILES = getMoneyWaveLegacyFilesPurgedAtWave4();

/** Active DsV2 desk surfaces — mockup-era scroll class must be 0 (use ds-desk-scroll). */

export const LEGACY_RESIDUE_ACTIVE_DESK_SURFACES = [
  'apps/web/src/ui/wallet/wallet-desk-panel.tsx',

  'apps/web/src/ui/home/earn-home-desk-surface.tsx',

  'apps/web/src/ui/pages/events-page.tsx',

  'apps/web/src/ui/account/account-page-body.tsx',

  'apps/web/src/ui/pages/dashboard-page.tsx',

  'apps/web/src/ui/pages/earn-missions-page.tsx',
] as const;

/** Consolidation C0–C5 wire status for Phase 10 closeout. */

export const CONSOLIDATION_C0_C5_STATUS = {
  C0: 'wired',

  C1: 'wired',

  C2: 'wired',

  C3: 'wired',

  C4: 'wired',

  C5: 'impl_partial',
} as const;
