import type { MessageKey } from '@phonara/i18n';

import { cn } from '@/product/primitives/lib/cn';

export type TradeDisplayFeedStaleBadgeProps = {
  visible: boolean;
  t: (key: MessageKey) => string;
  className?: string;
  testId?: string;
};

/** Display-only external feed delay badge — does not block submit (oracle gates are separate). */
export function TradeDisplayFeedStaleBadge({
  visible,
  t,
  className,
  testId = 'trade-display-feed-stale-badge',
}: TradeDisplayFeedStaleBadgeProps) {
  if (!visible) return null;

  return (
    <span
      data-testid={testId}
      className={cn(
        'bg-warning/15 text-warning inline-flex items-center rounded-(--ds-radius-sm) px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        className,
      )}
      title={t('trade.displayFeed.staleDescription')}
    >
      {t('trade.displayFeed.staleBadge')}
    </span>
  );
}
