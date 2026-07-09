/**
 * §7 Money Rollout — 5 waves · Build → Internal → Canary → Default (Wave-4 legacy purge).
 * Physical delete of legacy rollback files occurs only when `step === 'default'`.
 */

export type MoneyRolloutStep = 'build' | 'internal' | 'canary' | 'default';

export type MoneyRolloutWaveId =
  | 'phase3-wallet'
  | 'phase4-trade-bethub'
  | 'phase5-sports-cashout'
  | 'phase6-casino'
  | 'phase8-affiliate-payout';

export type MoneyRolloutWave = {
  readonly id: MoneyRolloutWaveId;
  readonly phase: 3 | 4 | 5 | 6 | 8;
  readonly label: string;
  readonly routes: readonly string[];
  /** Legacy rollback files purged at Wave-4 (`step === 'default'`). */
  readonly legacyRollbackFiles: readonly string[];
  readonly step: MoneyRolloutStep;
  /** Operator/CI canary evidence — required before advancing past `canary`. */
  readonly canaryEvidence?: {
    readonly sessions?: number;
    readonly days?: number;
    readonly sqlConservationGreen?: boolean;
    readonly moneyE2eRef?: string;
  };
};

/** Non-§7 rollback reserve — auth/landing/sports hub UI (not money-wave purge scope). */
export const NON_MONEY_ROLLBACK_RESERVE_FILES = [
  'apps/web/src/product/surfaces/login/login-page.tsx',
  'apps/web/src/product/surfaces/signup/signup-page.tsx',
  'apps/web/src/product/surfaces/reset-password/reset-password-page.tsx',
  'apps/web/src/product/surfaces/legal/terms-page.tsx',
  'apps/web/src/product/surfaces/landing/landing-page.tsx',
  'apps/web/src/components/shell/AuthEntryLayout.tsx',
  'apps/web/src/ui/pages/sports-page.tsx',
  'apps/web/src/components/sports/SportsHubPage.tsx',
  'apps/web/src/components/sports/SportsFixturePage.tsx',
] as const;

export const MONEY_ROLLOUT_WAVES: Record<MoneyRolloutWaveId, MoneyRolloutWave> = {
  'phase3-wallet': {
    id: 'phase3-wallet',
    phase: 3,
    label: 'Wallet',
    routes: ['/wallet', '/ledger', '/staking'],
    legacyRollbackFiles: [],
    step: 'default',
    canaryEvidence: {
      sessions: 50,
      days: 3,
      sqlConservationGreen: true,
      moneyE2eRef: 'wallet-d3.spec.ts',
    },
  },
  'phase4-trade-bethub': {
    id: 'phase4-trade-bethub',
    phase: 4,
    label: 'BetHub trade terminal',
    routes: ['/trade?section=trade'],
    legacyRollbackFiles: [
      'apps/web/src/components/shell/BetHubShell.tsx',
      'apps/web/src/ui/pages/trade-page.tsx',
      'apps/web/src/ui/trading/trade-desk-surface.tsx',
    ],
    step: 'default',
    canaryEvidence: {
      sessions: 50,
      days: 3,
      sqlConservationGreen: true,
      moneyE2eRef: 'shell-ia-d1.spec.ts',
    },
  },
  'phase5-sports-cashout': {
    id: 'phase5-sports-cashout',
    phase: 5,
    label: 'Sports cashout',
    routes: ['/sports'],
    legacyRollbackFiles: [],
    step: 'build',
    canaryEvidence: {
      moneyE2eRef: 'sports-ui.spec.ts',
    },
  },
  'phase6-casino': {
    id: 'phase6-casino',
    phase: 6,
    label: 'Casino',
    routes: ['/casino', '/casino/*'],
    legacyRollbackFiles: [
      'apps/web/src/ui/pages/casino-page.tsx',
      'apps/web/src/ui/casino/casino-desk-surface.tsx',
      'apps/web/src/ui/casino/casino-crash-desk.tsx',
      'apps/web/src/ui/pages/games-fairness-page.tsx',
      'apps/web/src/ui/pages/games-history-page.tsx',
      'apps/web/src/ui/pages/games-tournaments-page.tsx',
    ],
    step: 'default',
    canaryEvidence: {
      sessions: 50,
      days: 3,
      sqlConservationGreen: true,
      moneyE2eRef: 'casino.spec.ts',
    },
  },
  'phase8-affiliate-payout': {
    id: 'phase8-affiliate-payout',
    phase: 8,
    label: 'Affiliate/partner payout',
    routes: ['/partner', '/referral'],
    legacyRollbackFiles: [],
    step: 'build',
    canaryEvidence: {
      moneyE2eRef: 'affiliate-partner-display-contract.test.ts',
    },
  },
} as const;

export const MONEY_ROLLOUT_WAVE_IDS = Object.keys(MONEY_ROLLOUT_WAVES) as MoneyRolloutWaveId[];

/** Legacy files that must remain on disk (waves not yet at Wave-4 Default). */
export function getMoneyWaveLegacyFilesRequiredOnDisk(): readonly string[] {
  return MONEY_ROLLOUT_WAVE_IDS.flatMap((id) => {
    const wave = MONEY_ROLLOUT_WAVES[id];
    return wave.step === 'default' ? [] : wave.legacyRollbackFiles;
  });
}

/** Legacy files purged at Wave-4 Default per §7.1. */
export function getMoneyWaveLegacyFilesPurgedAtWave4(): readonly string[] {
  return MONEY_ROLLOUT_WAVE_IDS.flatMap((id) => {
    const wave = MONEY_ROLLOUT_WAVES[id];
    return wave.step === 'default' ? wave.legacyRollbackFiles : [];
  });
}

/** Full rollback reserve inventory for hygiene / closeout gates. */
export function getLegacyRollbackReserveFilesOnDisk(): readonly string[] {
  return [...NON_MONEY_ROLLBACK_RESERVE_FILES, ...getMoneyWaveLegacyFilesRequiredOnDisk()];
}

export function isMoneyRolloutWave4Complete(waveId: MoneyRolloutWaveId): boolean {
  return MONEY_ROLLOUT_WAVES[waveId].step === 'default';
}

export function moneyRolloutWavesAtDefaultCount(): number {
  return MONEY_ROLLOUT_WAVE_IDS.filter((id) => isMoneyRolloutWave4Complete(id)).length;
}
