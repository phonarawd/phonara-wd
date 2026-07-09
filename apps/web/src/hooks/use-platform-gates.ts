import { useQuery } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';
import {
  PLATFORM_CONFIG_KEYS,
  buildPlatformConfigMap,
  resolvePlatformGateBlocks,
  resolveShowKillSwitchBanner,
  type PlatformGateBlocks,
} from '../domain/platform-gate-contract';
import { supabase } from '../lib/supabase';

export {
  PLATFORM_CONFIG_KEYS,
  type PlatformConfigKey,
  type PlatformConfigMap,
  type PlatformGateBlocks,
} from '../domain/platform-gate-contract';

async function fetchPlatformConfig() {
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value')
    .in('key', [...PLATFORM_CONFIG_KEYS]);
  if (error) throw error;
  return buildPlatformConfigMap(data ?? []);
}

export type PlatformGateState = PlatformGateBlocks & {
  loading: boolean;
  showKillSwitchBanner: boolean;
};

export function usePlatformGates(): PlatformGateState {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data, isLoading } = useQuery({
    queryKey: ['app-config', 'platform-gates'],
    queryFn: fetchPlatformConfig,
    staleTime: 15_000,
    refetchOnMount: 'always',
  });

  const blocks = resolvePlatformGateBlocks(data ?? buildPlatformConfigMap([]));

  return {
    loading: isLoading,
    showKillSwitchBanner: resolveShowKillSwitchBanner(pathname, blocks),
    ...blocks,
  };
}
