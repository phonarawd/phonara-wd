import type { Currency } from '@phonara/shared-types';

import type { DaW4MotionTier } from '@/domain/da-w4-motion-system-display-contract';
import { isNegativeAmount, isPositiveAmount } from '@/lib/money-display';
import { useT } from '@/product/i18n';
import { resolveMoneyDisplayParts } from '@/product/primitives/lib/money-display-parts';
import { cn } from '@/product/primitives/lib/cn';
import { useCountUp } from '@/product/primitives/lib/use-count-up';

export interface MoneyDisplayCountUpOptions {
  /** When false, skip Signal Pulse. Default true when `countUp` is set. */
  enabled?: boolean;
  /** L2 financial → instant. Default L1. */
  tier?: DaW4MotionTier;
}

export interface MoneyDisplayProps {
  /** RPC decimal string — no client-side arithmetic (§25.2). */
  amount: string;
  currency: Currency;
  signed?: boolean;
  /** When true, currency suffix renders in a separate baseline-aligned span (§25.1-bis). */
  showCurrency?: boolean;
  size?: 'default' | 'hero';
  /**
   * Signal Pulse — animate amount changes ≤400ms (§34.15).
   * Display-only; RPC `amount` remains settlement truth. L2 / reduced-motion = instant.
   */
  countUp?: boolean | MoneyDisplayCountUpOptions;
  className?: string;
}

function signOf(amount: string): 'up' | 'down' | 'flat' {
  if (isPositiveAmount(amount)) return 'up';
  if (isNegativeAmount(amount)) return 'down';
  return 'flat';
}

function resolveCountUpOptions(countUp: boolean | MoneyDisplayCountUpOptions | undefined): {
  enabled: boolean;
  tier: DaW4MotionTier;
} {
  if (!countUp) return { enabled: false, tier: 'L1' };
  if (countUp === true) return { enabled: true, tier: 'L1' };
  return {
    enabled: countUp.enabled ?? true,
    tier: countUp.tier ?? 'L1',
  };
}

/** Display-only money formatting via @phonara/money (§25.2 · §25.1-bis suffix grammar). */
export function MoneyDisplay({
  amount,
  currency,
  signed,
  showCurrency,
  size,
  countUp,
  className,
}: MoneyDisplayProps) {
  const t = useT();
  const countUpOpts = resolveCountUpOptions(countUp);
  const displayAmount = useCountUp(amount, {
    enabled: countUpOpts.enabled,
    tier: countUpOpts.tier,
  });
  const { amountText, suffixKey } = resolveMoneyDisplayParts(displayAmount, currency, {
    signed,
    showCurrency,
  });
  // Sign from settlement target (not mid-animation) so color does not flicker.
  const sign = signed ? signOf(amount) : undefined;

  const amountClasses = cn(
    'tabular-nums',
    size === 'hero' && 'font-display text-(--ds-text-hero)',
    sign === 'up' && 'text-market-up',
    sign === 'down' && 'text-market-down',
  );

  const rootClasses = cn(className);
  const countUpAttr = countUpOpts.enabled ? 'true' : undefined;

  if (!suffixKey) {
    return (
      <span
        data-sign={sign}
        data-money-display
        data-count-up={countUpAttr}
        className={cn(amountClasses, rootClasses)}
      >
        {amountText}
      </span>
    );
  }

  return (
    <span data-sign={sign} data-money-display data-count-up={countUpAttr} className={rootClasses}>
      <span className={cn('money-display__group', amountClasses)}>
        <span className="money-display__amount">{amountText}</span>
        <span className="money-display__suffix suffix">{t(suffixKey)}</span>
      </span>
    </span>
  );
}
