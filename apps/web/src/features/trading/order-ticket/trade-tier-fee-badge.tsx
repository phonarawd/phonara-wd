import { Crown } from 'lucide-react';

import { resolveTierCssVar } from '@/domain/tier-me-display-contract';
import type { EarnVipTier } from '@/domain/unified-tier-display-contract';
import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';
import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

export type TradeTierFeeBadgeProps = {
  tier: EarnVipTier;
  className?: string;
};

/** §25.12.9.1-E #19 — VIP badge + HelpTip only; no numeric fee row (ticket-density owner). */
export function TradeTierFeeBadge({ tier, className }: TradeTierFeeBadgeProps) {
  const t = useT();
  const tierColorVar = resolveTierCssVar(tier);

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      data-testid="trade-tier-fee-badge"
    >
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{
          background: `color-mix(in oklch, var(${tierColorVar}) 18%, transparent)`,
          color: `var(${tierColorVar})`,
        }}
        data-testid="trade-tier-fee-badge-label"
      >
        <Crown className="size-3.5" aria-hidden />
        {t(`earn.tier.${tier}`)}
      </span>
      <TradeHelpTip termId="tier_fee" className="text-xs" />
    </div>
  );
}
