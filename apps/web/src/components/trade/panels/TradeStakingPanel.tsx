import { StakingDiscoverGrid } from "@/components/trade/terminal/staking/StakingDiscoverGrid";

export function TradeStakingPanel({ readOnly = false }: { readOnly?: boolean }) {
  return <StakingDiscoverGrid readOnly={readOnly} />;
}
