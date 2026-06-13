import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export type CardElevation = 'flat' | 'raised' | 'sheet';
export type CardDensity = 'compact' | 'comfortable';

export const cardVariants = cva(
  [
    'relative rounded-2xl border border-border backdrop-blur-[var(--glass-blur)]',
    'transition-[transform,box-shadow,border-color,background-color] duration-[var(--motion-duration-confirmation)] ease-[var(--motion-ease-standard)]',
  ].join(' '),
  {
  variants: {
    elevation: {
        flat: 'bg-surface/80 shadow-[var(--surface-highlight)]',
        raised: 'bg-surface/90 shadow-[var(--elevation-1)]',
        sheet: 'bg-surface-2/95 shadow-[var(--elevation-sheet)]',
      },
      density: {
        compact: '',
        comfortable: '',
      },
      interactive: {
        true: 'hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-elevated hover:shadow-[var(--elevation-2)]',
        false: '',
      },
    },
    defaultVariants: {
      elevation: 'flat',
      density: 'comfortable',
      interactive: false,
    },
  },
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, elevation, density, interactive, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(cardVariants({ elevation, density, interactive }), className)}
      {...props}
    />
  );
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between gap-3 px-[var(--density-comfortable-panel-padding)] pt-[var(--density-comfortable-panel-padding)]',
          className,
        )}
        {...props}
      />
    );
  },
);

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-[length:var(--text-label)] font-[var(--font-weight-label)] uppercase tracking-[0.08em] text-muted',
          className,
        )}
        {...props}
      />
    );
  },
);

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'px-[var(--density-comfortable-panel-padding)] py-[var(--density-comfortable-panel-padding)]',
          className,
        )}
        {...props}
      />
    );
  },
);

export const CardDivider = forwardRef<HTMLHRElement, HTMLAttributes<HTMLHRElement>>(
  function CardDivider({ className, ...props }, ref) {
    return (
      <hr
        ref={ref}
        className={cn('mx-5 my-0 h-px border-0 bg-[var(--color-divider)]', className)}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardContent.displayName = 'CardContent';
CardDivider.displayName = 'CardDivider';
