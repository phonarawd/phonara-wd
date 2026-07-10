import { useEffect } from 'react';
import type { Currency } from '@phonara/shared-types';

import {
  CASINO_WIN_TIER_LABEL_KEYS,
  type CasinoWinTier,
  shouldShowCasinoWinTierOverlay,
} from '@/domain/casino-outcome-replay-contract';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';

export type WinTierOverlayProps = {
  tier: CasinoWinTier;
  payout: string;
  multiplier: string;
  currency: Currency;
  autoBetActive?: boolean;
  onSkip: () => void;
  className?: string;
};

const AUTO_SKIP_MS = {
  big: 1500,
  mega: 0,
} as const;

/** Big/Mega overlay — Skip required · auto-bet caps duration · reduced-motion → inline only. */
export function WinTierOverlay({
  tier,
  payout,
  multiplier,
  currency,
  autoBetActive = false,
  onSkip,
  className,
}: WinTierOverlayProps) {
  const t = useT();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!shouldShowCasinoWinTierOverlay(tier)) return;
    if (reducedMotion) {
      onSkip();
      return;
    }
    if (!autoBetActive) return;
    const ms = tier === 'mega' ? AUTO_SKIP_MS.mega : AUTO_SKIP_MS.big;
    if (ms === 0) {
      onSkip();
      return;
    }
    const id = window.setTimeout(onSkip, ms);
    return () => window.clearTimeout(id);
  }, [autoBetActive, onSkip, reducedMotion, tier]);

  useEffect(() => {
    if (!shouldShowCasinoWinTierOverlay(tier) || reducedMotion) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip, reducedMotion, tier]);

  if (!shouldShowCasinoWinTierOverlay(tier) || reducedMotion) return null;

  const labelKey = CASINO_WIN_TIER_LABEL_KEYS[tier === 'mega' ? 'mega' : 'big'];

  return (
    <div
      className={cn(
        'bg-surface/95 border-line absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 border p-6 text-center backdrop-blur-sm',
        className,
      )}
      role="dialog"
      aria-modal="true"
      data-testid="casino-win-tier-overlay"
      data-win-tier={tier}
      onClick={onSkip}
    >
      <p className="text-foreground m-0 text-lg font-semibold md:text-xl">{t(labelKey)}</p>
      <MoneyDisplay
        amount={payout}
        currency={currency}
        showCurrency
        size="hero"
        className="text-2xl"
      />
      <p className="text-foreground-muted m-0 tabular-nums text-sm" data-testid="casino-win-multiplier">
        {multiplier}×
      </p>
      <Button
        type="button"
        variant="secondary"
        data-testid="casino-win-tier-skip"
        onClick={(e) => {
          e.stopPropagation();
          onSkip();
        }}
      >
        {t('casino.win.tier.skip')}
      </Button>
    </div>
  );
}
