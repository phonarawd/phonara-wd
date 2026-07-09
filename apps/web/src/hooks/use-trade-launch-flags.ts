import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

const TRADE_LAUNCH_FLAG_KEYS = ['feature_cross_margin_enabled', 'feature_funding_enabled'] as const;

type TradeLaunchFlagKey = (typeof TRADE_LAUNCH_FLAG_KEYS)[number];

async function fetchTradeLaunchFlags(): Promise<Record<TradeLaunchFlagKey, string | null>> {
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value')
    .in('key', [...TRADE_LAUNCH_FLAG_KEYS]);
  if (error) throw error;
  const map = Object.fromEntries(TRADE_LAUNCH_FLAG_KEYS.map((key) => [key, null])) as Record<
    TradeLaunchFlagKey,
    string | null
  >;
  for (const row of data ?? []) {
    if (row.key in map) {
      map[row.key as TradeLaunchFlagKey] = row.value;
    }
  }
  return map;
}

function isFlagOn(value: string | null | undefined): boolean {
  return value === 'true';
}

/** Launch gates from app_config (migration 20260620000140). Defaults off while loading. */
export function useTradeLaunchFlags() {
  const { data, isLoading } = useQuery({
    queryKey: ['app-config', 'trade-launch-flags'],
    queryFn: fetchTradeLaunchFlags,
    staleTime: 15_000,
  });

  return {
    loading: isLoading,
    crossMarginEnabled: isFlagOn(data?.feature_cross_margin_enabled),
    fundingSettlementEnabled: isFlagOn(data?.feature_funding_enabled),
  };
}
