import type { FiatHintView } from '@/domain/fiat-reference-display-contract';
import { P9_TRADE_FIAT_HINT_WIRE_TODO } from '@/domain/fiat-reference-display-contract';
import { FiatHintSecondaryLine } from '@/product/primitives/money-display-with-fiat-hint';
import { cn } from '@/product/primitives/lib/cn';

export type TradePriceWithFiatHintProps = {
  primaryDisplay: string;
  fiatHint: FiatHintView;
  className?: string;
  primaryClassName?: string;
  testId?: string;
};

/** Trade header price — formatted USDT primary + secondary FiatHint (Fiat#7). */
export function TradePriceWithFiatHint({
  primaryDisplay,
  fiatHint,
  className,
  primaryClassName,
  testId,
}: TradePriceWithFiatHintProps) {
  return (
    <span
      data-trade-fiat-hint
      data-fiat-hint-todo={P9_TRADE_FIAT_HINT_WIRE_TODO}
      className={cn('inline-flex flex-col items-start gap-0.5', className)}
    >
      <span data-testid={testId} className={primaryClassName}>
        {primaryDisplay}
      </span>
      <FiatHintSecondaryLine fiatHint={fiatHint} hintLayout="secondary" />
    </span>
  );
}
