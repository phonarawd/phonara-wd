import type { CSSProperties, ReactNode } from 'react';
import type { Currency } from '@phonara/shared-types';
import { format as formatCanonical, money as makeMoney } from '@phonara/money';
import { cn } from '../lib/cn';
import { Ticker, type TickerProps } from './ticker';

export interface FormatMoneyOptions {
  /** Append the currency ticker, e.g. "1,234 PHON". */
  showCurrency?: boolean;
  /** Force a leading "+" for non-negative values. */
  signed?: boolean;
  /** Group the integer part with thousands separators (default true). */
  grouping?: boolean;
}

export type MoneyEmphasis = 'default' | 'hero' | 'muted';
export type MoneyTone = 'neutral' | 'positive' | 'negative' | 'risk';

function groupInteger(intPart: string): string {
  const neg = intPart.startsWith('-');
  const digits = neg ? intPart.slice(1) : intPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return neg ? `-${grouped}` : grouped;
}

/**
 * Format a raw decimal string for a currency with no floating point math.
 * Truncates to the currency's precision (via @phonara/money) then applies
 * thousands grouping on the integer part only.
 */
export function formatMoney(
  amount: string,
  currency: Currency,
  opts: FormatMoneyOptions = {},
): string {
  const { showCurrency = false, signed = false, grouping = true } = opts;
  const canonical = formatCanonical(makeMoney(amount, currency));
  const isNeg = canonical.startsWith('-');
  const unsigned = isNeg ? canonical.slice(1) : canonical;
  const parts = unsigned.split('.');
  const intPart = parts[0] ?? '0';
  const fracPart = parts[1];
  const groupedInt = grouping ? groupInteger(intPart) : intPart;
  let out = fracPart ? `${groupedInt}.${fracPart}` : groupedInt;
  if (isNeg) out = `-${out}`;
  else if (signed) out = `+${out}`;
  if (showCurrency) out = `${out} ${currency}`;
  return out;
}

export interface MoneyProps extends FormatMoneyOptions {
  amount: string;
  currency: Currency;
  /** Tint by sign: positive → up color, negative → down color. */
  colorize?: boolean;
  emphasis?: MoneyEmphasis;
  tone?: MoneyTone;
  /** Default true — tabular numerals for stable width. */
  tabularNums?: boolean;
  /** CSS pulse on amount change — no JS interpolation. */
  pulseOnChange?: boolean;
  /** Render as a live ticker chip. Formatting still goes through @phonara/money. */
  ticker?: boolean;
  previousAmount?: string;
  tickerLabel?: ReactNode;
  tickerDensity?: TickerProps['density'];
  tickerDirection?: TickerProps['direction'];
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
}

const emphasisCls: Record<MoneyEmphasis, string> = {
  default: 'text-[length:inherit] font-[var(--money-default-weight)]',
  hero:
    'text-[length:var(--money-hero-size)] font-[var(--money-hero-weight)] leading-none tracking-[var(--tracking-title)] drop-shadow-[0_0_20px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]',
  muted: 'opacity-[var(--money-muted-opacity)]',
};

const toneCls: Record<MoneyTone, string> = {
  neutral: 'text-fg',
  positive: 'text-[var(--color-positive)]',
  negative: 'text-[var(--color-negative)]',
  risk: 'text-[var(--color-risk)]',
};

/**
 * Tabular-numbers money display. Always renders deterministic, precision-safe
 * output derived from the Decimal engine.
 */
export function Money({
  amount,
  currency,
  showCurrency,
  signed,
  grouping,
  colorize,
  emphasis = 'default',
  tone = 'neutral',
  tabularNums = true,
  pulseOnChange = false,
  ticker = false,
  previousAmount,
  tickerLabel,
  tickerDensity,
  tickerDirection,
  className,
  style,
  'data-testid': dataTestId,
}: MoneyProps) {
  const text = formatMoney(amount, currency, { showCurrency, signed, grouping });
  const isNeg = text.startsWith('-');
  const isPos = !isNeg && text !== '0';

  if (ticker) {
    return (
      <Ticker
        value={amount}
        previousValue={previousAmount}
        label={tickerLabel}
        density={tickerDensity}
        direction={tickerDirection}
        format={(value) => formatMoney(value, currency, { showCurrency, signed, grouping })}
        className={className}
        style={style}
        data-testid={dataTestId}
      />
    );
  }

  return (
    <span
      key={pulseOnChange ? `${currency}:${amount}` : undefined}
      className={cn(
        tabularNums && 'tabular-nums',
        'tracking-tight',
        emphasisCls[emphasis],
        !colorize && toneCls[tone],
        colorize && isNeg && 'text-down',
        colorize && isPos && 'text-up',
        pulseOnChange && 'pn-anim-money-pulse',
        className,
      )}
      style={style}
      data-currency={currency}
      data-tone={colorize ? (isNeg ? 'negative' : isPos ? 'positive' : 'neutral') : tone}
      data-testid={dataTestId}
    >
      {text}
    </span>
  );
}
