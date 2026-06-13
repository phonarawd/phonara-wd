import { forwardRef, useEffect, useMemo, useRef, useState, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export type DecimalLike = string | { toString(): string };
export type NumberDirection = 'up' | 'down' | 'flat';

function decimalToString(value: DecimalLike): string {
  return typeof value === 'string' ? value : value.toString();
}

function splitDecimal(input: string): { sign: -1 | 1; int: string; frac: string } {
  const trimmed = input.trim();
  const sign: -1 | 1 = trimmed.startsWith('-') ? -1 : 1;
  const unsigned = trimmed.replace(/^[+-]/, '');
  const [intPart = '0', fracPart = ''] = unsigned.split('.');
  return {
    sign,
    int: intPart.replace(/^0+(?=\d)/, '') || '0',
    frac: fracPart.replace(/0+$/, ''),
  };
}

export function compareDecimalLike(a: DecimalLike, b: DecimalLike): NumberDirection {
  const left = splitDecimal(decimalToString(a));
  const right = splitDecimal(decimalToString(b));
  if (left.sign !== right.sign) return left.sign > right.sign ? 'up' : 'down';

  const multiplier = left.sign;
  if (left.int.length !== right.int.length) {
    return (left.int.length > right.int.length ? 1 : -1) * multiplier > 0 ? 'up' : 'down';
  }
  if (left.int !== right.int) {
    return (left.int > right.int ? 1 : -1) * multiplier > 0 ? 'up' : 'down';
  }

  const maxFrac = Math.max(left.frac.length, right.frac.length);
  const leftFrac = left.frac.padEnd(maxFrac, '0');
  const rightFrac = right.frac.padEnd(maxFrac, '0');
  if (leftFrac === rightFrac) return 'flat';
  return (leftFrac > rightFrac ? 1 : -1) * multiplier > 0 ? 'up' : 'down';
}

export const animatedNumberVariants = cva(
  'inline-flex min-w-0 items-baseline tabular-nums transition-[color,text-shadow,filter] duration-[var(--motion-duration-confirmation)] ease-[var(--motion-ease-standard)]',
  {
    variants: {
      tone: {
        neutral: 'text-fg',
        muted: 'text-muted',
        up: 'text-up',
        down: 'text-down',
        warning: 'text-warning',
        primary: 'text-primary',
      },
      emphasis: {
        body: 'text-[length:var(--text-body)] font-[var(--font-weight-numeric)] tracking-[var(--tracking-numeric)]',
        label: 'text-[length:var(--text-label)] font-[var(--font-weight-label)] tracking-[var(--tracking-numeric)]',
        title: 'text-[length:var(--text-heading)] font-[var(--font-weight-heading)] tracking-[var(--tracking-heading)]',
        hero: 'text-[length:var(--money-hero-size)] font-[var(--money-hero-weight)] leading-none tracking-[var(--tracking-title)]',
      },
      flash: {
        up: 'text-up [text-shadow:0_0_18px_color-mix(in_srgb,var(--color-up)_32%,transparent)]',
        down: 'text-down [text-shadow:0_0_18px_color-mix(in_srgb,var(--color-down)_32%,transparent)]',
        flat: '',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      emphasis: 'body',
      flash: 'flat',
    },
  },
);

export interface AnimatedNumberProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof animatedNumberVariants> {
  value: DecimalLike;
  format?: (value: string) => string;
  flashOnChange?: boolean;
}

export const AnimatedNumber = forwardRef<HTMLSpanElement, AnimatedNumberProps>(
  function AnimatedNumber(
    { value, format, flashOnChange = true, tone, emphasis, className, ...props },
    ref,
  ) {
    const valueText = useMemo(() => decimalToString(value), [value]);
    const previous = useRef(valueText);
    const frameRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);
    const [flash, setFlash] = useState<NumberDirection>('flat');

    useEffect(() => {
      if (!flashOnChange || previous.current === valueText) {
        previous.current = valueText;
        return;
      }

      const direction = compareDecimalLike(valueText, previous.current);
      previous.current = valueText;

      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);

      frameRef.current = requestAnimationFrame(() => {
        setFlash(direction);
        timeoutRef.current = window.setTimeout(() => setFlash('flat'), 420);
      });

      return () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      };
    }, [flashOnChange, valueText]);

    return (
      <span
        ref={ref}
        className={cn(animatedNumberVariants({ tone, emphasis, flash }), className)}
        data-direction={flash}
        {...props}
      >
        {format ? format(valueText) : valueText}
      </span>
    );
  },
);

AnimatedNumber.displayName = 'AnimatedNumber';
