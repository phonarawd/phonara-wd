import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ElementType, type HTMLAttributes } from 'react';

import { cn } from '@/product/primitives/lib/cn';

export const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      display:
        'font-display text-(--ds-text-hero) font-bold leading-[var(--ds-line-height-heading)] tracking-[var(--ds-tracking-heading)]',
      hero: 'font-display text-(--ds-text-hero) font-bold leading-[var(--ds-line-height-heading)] tracking-[var(--ds-tracking-heading)]',
      headline:
        'font-display text-3xl font-bold leading-[var(--ds-line-height-heading)] tracking-[var(--ds-tracking-heading)]',
      title:
        'text-2xl font-semibold leading-[var(--ds-line-height-heading)] tracking-[var(--ds-tracking-heading)]',
      section:
        'text-xl font-semibold leading-[var(--ds-line-height-heading)] tracking-[var(--ds-tracking-heading)]',
      body: 'text-base font-normal leading-[var(--ds-line-height-body)]',
      caption: 'text-sm text-foreground-muted leading-[var(--ds-line-height-body)]',
      label: 'text-sm font-medium leading-[var(--ds-line-height-body)]',
      tiny: 'text-xs text-foreground-muted leading-[var(--ds-line-height-body)]',
      'money-mono': 'font-mono text-base tabular-nums lining-nums tracking-normal',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

type TextVariant = NonNullable<VariantProps<typeof textVariants>['variant']>;

const DEFAULT_ELEMENT: Record<TextVariant, ElementType> = {
  display: 'h1',
  hero: 'h1',
  headline: 'h2',
  title: 'h3',
  section: 'h4',
  body: 'p',
  caption: 'p',
  label: 'span',
  tiny: 'span',
  'money-mono': 'span',
};

export interface TextProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
  as?: ElementType;
}

/** Typography primitive — Digital Aurora §34.6 Text scale. */
export const Text = forwardRef<HTMLElement, TextProps>(
  ({ className, variant = 'body', as, ...props }, ref) => {
    const resolved = variant ?? 'body';
    const Comp = as ?? DEFAULT_ELEMENT[resolved];
    return (
      <Comp
        ref={ref}
        data-text-variant={resolved}
        className={cn(textVariants({ variant: resolved, className }))}
        {...props}
      />
    );
  },
);
Text.displayName = 'Text';
