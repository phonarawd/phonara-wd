/**
 * Platform kill-switch keys readable by the user app via public `app_config` RLS.
 * Keep in sync with `supabase/migrations/20260702000001_platform_gate_client_read.sql`
 * and admin ops `KILL_DEFS` (excluding admin-only keys like referral).
 */
export const PLATFORM_CONFIG_KEYS = [
  'system_halt',
  'system_readonly',
  'feature_game_enabled',
  'feature_spot_enabled',
  'feature_futures_enabled',
  'feature_staking_enabled',
  'feature_deposit_enabled',
  'feature_withdrawal_enabled',
  'feature_sports_enabled',
] as const;

export type PlatformConfigKey = (typeof PLATFORM_CONFIG_KEYS)[number];
export type PlatformConfigMap = Record<PlatformConfigKey, string | null>;

export type PlatformGateBlocks = {
  systemHalted: boolean;
  casinoBlocked: boolean;
  spotBlocked: boolean;
  futuresBlocked: boolean;
  stakingBlocked: boolean;
  depositBlocked: boolean;
  withdrawalBlocked: boolean;
  sportsBlocked: boolean;
  tradeBlocked: boolean;
};

export function isFeatureKillSwitchOff(value: string | null | undefined): boolean {
  return value === 'false';
}

export function isSystemModeActive(value: string | null | undefined): boolean {
  return value === 'true';
}

export function buildPlatformConfigMap(
  rows: ReadonlyArray<{ key: string; value: string | null }>,
): PlatformConfigMap {
  const map = Object.fromEntries(
    PLATFORM_CONFIG_KEYS.map((key) => [key, null]),
  ) as PlatformConfigMap;
  for (const row of rows) {
    if (row.key in map) {
      map[row.key as PlatformConfigKey] = row.value;
    }
  }
  return map;
}

export function resolvePlatformGateBlocks(config: PlatformConfigMap): PlatformGateBlocks {
  const systemHalted =
    isSystemModeActive(config.system_halt) || isSystemModeActive(config.system_readonly);
  const casinoBlocked = systemHalted || isFeatureKillSwitchOff(config.feature_game_enabled);
  const spotBlocked = systemHalted || isFeatureKillSwitchOff(config.feature_spot_enabled);
  const futuresBlocked = systemHalted || isFeatureKillSwitchOff(config.feature_futures_enabled);
  const stakingBlocked = systemHalted || isFeatureKillSwitchOff(config.feature_staking_enabled);
  const depositBlocked = systemHalted || isFeatureKillSwitchOff(config.feature_deposit_enabled);
  const withdrawalBlocked =
    systemHalted || isFeatureKillSwitchOff(config.feature_withdrawal_enabled);
  const sportsBlocked = systemHalted || isFeatureKillSwitchOff(config.feature_sports_enabled);

  return {
    systemHalted,
    casinoBlocked,
    spotBlocked,
    futuresBlocked,
    stakingBlocked,
    depositBlocked,
    withdrawalBlocked,
    sportsBlocked,
    tradeBlocked: spotBlocked || futuresBlocked,
  };
}

export function resolveShowKillSwitchBanner(pathname: string, blocks: PlatformGateBlocks): boolean {
  const onCasino = pathname.startsWith('/casino');
  const onTrade = pathname.startsWith('/trade');
  const onStaking = pathname.startsWith('/staking');
  const onWallet = pathname.startsWith('/wallet');
  const onSports = pathname.startsWith('/sports');

  const routeFeatureBlocked =
    (onCasino && blocks.casinoBlocked) ||
    (onTrade && blocks.tradeBlocked) ||
    (onStaking && blocks.stakingBlocked) ||
    (onWallet && (blocks.depositBlocked || blocks.withdrawalBlocked)) ||
    (onSports && blocks.sportsBlocked);

  return blocks.systemHalted || routeFeatureBlocked;
}
