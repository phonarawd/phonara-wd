import type { Currency } from '@phonara/shared-types';

import type { CasinoWinTier } from '@/domain/casino-outcome-replay-contract';
import { useT } from '@/product/i18n';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { cn } from '@/product/primitives/lib/cn';

export type GameOutcomeLayerProps = {
  tier: CasinoWinTier;
  payout: string;
  stake: string;
  currency: Currency;
  className?: string;
};

/** Always-visible numeric outcome — trust layer companion to stage L1 / WinTier overlay. */
export function GameOutcomeLayer({
  tier,
  payout,
  stake,
  currency,
  className,
}: GameOutcomeLayerProps) {
  const t = useT();

  return (
    <div
      className={cn(
        'border-line bg-surface-raised flex flex-wrap items-center gap-3 rounded-md border px-3 py-2',
        className,
      )}
      data-testid="casino-game-outcome-layer"
      data-win-tier={tier}
    >
      <span className="text-foreground-muted text-xs">{t('casino.lastPayout')}</span>
      <MoneyDisplay amount={payout} currency={currency} showCurrency className="text-sm" />
      <span className="text-foreground-muted text-xs">{t('casino.stake')}</span>
      <MoneyDisplay amount={stake} currency={currency} showCurrency className="text-sm" />
    </div>
  );
}
