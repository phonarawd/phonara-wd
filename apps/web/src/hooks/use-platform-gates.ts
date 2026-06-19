import { useQuery } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';
import { supabase } from '../lib/supabase';

const PLATFORM_CONFIG_KEYS = [
  'system_halt',
  'system_readonly',
  'feature_game_enabled',
  'feature_spot_enabled',
  'feature_futures_enabled',
  'feature_staking_enabled',
  'feature_deposit_enabled',
  'feature_withdrawal_enabled',
] as const;

type PlatformConfigKey = (typeof PLATFORM_CONFIG_KEYS)[number];

async function fetchPlatformConfig(): Promise<Record<PlatformConfigKey, string | null>> {
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value')
    .in('key', [...PLATFORM_CONFIG_KEYS]);
  if (error) throw error;
  const map = Object.fromEntries(
    PLATFORM_CONFIG_KEYS.map((key) => [key, null]),
  ) as Record<PlatformConfigKey, string | null>;
  for (const row of data ?? []) {
    if (row.key in map) {
      map[row.key as PlatformConfigKey] = row.value;
    }
  }
  return map;
}

function isFlagOff(value: string | null | undefined): boolean {
  return value === 'false';
}

export type PlatformGateState = {
  loading: boolean;
  showKillSwitchBanner: boolean;
  tradeBlocked: boolean;
  casinoBlocked: boolean;
  stakingBlocked: boolean;
  depositBlocked: boolean;
  withdrawalBlocked: boolean;
};

export function usePlatformGates(): PlatformGateState {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data, isLoading } = useQuery({
    queryKey: ['app-config', 'platform-gates'],
    queryFn: fetchPlatformConfig,
    staleTime: 15_000,
  });

  const systemHalted =
    isFlagOff(data?.system_halt) || isFlagOff(data?.system_readonly);
  const casinoBlocked = systemHalted || isFlagOff(data?.feature_game_enabled);
  const spotBlocked = systemHalted || isFlagOff(data?.feature_spot_enabled);
  const futuresBlocked = systemHalted || isFlagOff(data?.feature_futures_enabled);
  const stakingBlocked = systemHalted || isFlagOff(data?.feature_staking_enabled);
  const depositBlocked = systemHalted || isFlagOff(data?.feature_deposit_enabled);
  const withdrawalBlocked = systemHalted || isFlagOff(data?.feature_withdrawal_enabled);

  const onCasino = pathname.startsWith('/casino');
  const onTrade = pathname.startsWith('/trade');
  const onStaking = pathname.startsWith('/staking');
  const onWallet = pathname.startsWith('/wallet');

  const routeFeatureBlocked =
    (onCasino && casinoBlocked) ||
    (onTrade && (spotBlocked || futuresBlocked)) ||
    (onStaking && stakingBlocked) ||
    (onWallet && (depositBlocked || withdrawalBlocked));

  return {
    loading: isLoading,
    showKillSwitchBanner: systemHalted || routeFeatureBlocked,
    tradeBlocked: spotBlocked || futuresBlocked,
    casinoBlocked,
    stakingBlocked,
    depositBlocked,
    withdrawalBlocked,
  };
}
