import type { ReactNode } from 'react';

import {
  FIAT_HINT_I18N_KEYS,
  type FiatHintView,
  P4_FIAT_MONEY_DISPLAY_HINT_TODO,
} from '@/domain/fiat-reference-display-contract';
import { useI18n, useT } from '@/product/i18n';
import { formatFiatHintAsOfTime } from '@/product/primitives/lib/fiat-hint-display';
import { cn } from '@/product/primitives/lib/cn';
import { MoneyDisplay, type MoneyDisplayProps } from '@/product/primitives/money-display';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/product/primitives/tooltip';

export { P4_FIAT_MONEY_DISPLAY_HINT_TODO };

export interface MoneyDisplayWithFiatHintProps extends MoneyDisplayProps {
  /** Display-only secondary hint from `toFiatHint` — never settlement truth (§13.1.4). */
  fiatHint: FiatHintView;
  /** Optional layout tweak — Earn co-primary is Fiat#8; default secondary stays muted. */
  hintLayout?: 'secondary' | 'co-primary';
}

export function FiatHintSecondaryLine({
  fiatHint,
  hintLayout,
}: {
  fiatHint: FiatHintView;
  hintLayout: 'secondary' | 'co-primary';
}) {
  const t = useT();
  const { locale } = useI18n();

  if (fiatHint.disabled) return null;

  const unavailable = fiatHint.formattedHint === '—';
  const hintText = unavailable ? t(FIAT_HINT_I18N_KEYS.unavailable) : fiatHint.formattedHint;
  const asOfTime = formatFiatHintAsOfTime(fiatHint.asOf, locale);
  const asOfLabel = asOfTime != null ? t(FIAT_HINT_I18N_KEYS.asOf, { time: asOfTime }) : undefined;

  const hintClasses = cn(
    'tabular-nums',
    hintLayout === 'secondary' && 'text-xs text-foreground-muted',
    hintLayout === 'co-primary' && 'text-sm text-foreground',
  );

  const hintSpan = (
    <span
      data-fiat-hint
      data-display-only="true"
      data-fiat-target={fiatHint.targetFiat}
      className={hintClasses}
    >
      {hintText}
    </span>
  );

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {asOfLabel ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-fiat-hint
                data-display-only="true"
                data-fiat-target={fiatHint.targetFiat}
                className={cn(
                  'inline-flex cursor-help items-center border-0 bg-transparent p-0 text-left',
                  hintClasses,
                )}
                aria-label={asOfLabel}
              >
                {hintText}
              </button>
            </TooltipTrigger>
            <TooltipContent data-fiat-hint-as-of>{asOfLabel}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        hintSpan
      )}
      {fiatHint.stale ? (
        <span
          data-fiat-hint-stale
          className="rounded-(--ds-radius-full) bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning"
        >
          {t(FIAT_HINT_I18N_KEYS.staleBadge)}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Primary settlement `MoneyDisplay` + secondary FiatHint span (§13.1.4.3 · Fiat#5).
 * Disclaimer renders once per surface via `FiatHintDisclaimer` or `disclaimerSlot`.
 */
export function MoneyDisplayWithFiatHint({
  fiatHint,
  hintLayout = 'secondary',
  className,
  ...moneyProps
}: MoneyDisplayWithFiatHintProps) {
  return (
    <span
      data-money-display-with-fiat-hint
      data-fiat-hint-todo={P4_FIAT_MONEY_DISPLAY_HINT_TODO}
      className={cn('inline-flex flex-col items-start gap-0.5', className)}
    >
      <MoneyDisplay {...moneyProps} />
      <FiatHintSecondaryLine fiatHint={fiatHint} hintLayout={hintLayout} />
    </span>
  );
}

export interface FiatHintDisclaimerProps {
  className?: string;
}

/** Surface-level disclaimer slot — render once per page (§13.1.4.3). */
export function FiatHintDisclaimer({ className }: FiatHintDisclaimerProps) {
  const t = useT();

  return (
    <p
      data-fiat-hint-disclaimer
      data-display-only="true"
      className={cn('m-0 text-xs leading-relaxed text-foreground-muted', className)}
    >
      {t(FIAT_HINT_I18N_KEYS.disclaimer)}
    </p>
  );
}

export interface MoneyDisplayWithFiatHintSlotProps {
  children: ReactNode;
  /** Optional disclaimer slot — surfaces pass `FiatHintDisclaimer` once. */
  disclaimerSlot?: ReactNode;
  className?: string;
}

/** Layout wrapper when a surface needs grouped money rows + one disclaimer slot. */
export function MoneyDisplayWithFiatHintSlot({
  children,
  disclaimerSlot,
  className,
}: MoneyDisplayWithFiatHintSlotProps) {
  return (
    <div data-fiat-hint-slot className={cn('flex flex-col gap-2', className)}>
      {children}
      {disclaimerSlot}
    </div>
  );
}
