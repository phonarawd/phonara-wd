import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/product/primitives/lib/cn';

export const cardVariants = cva(
  'rounded-(--ds-radius-lg) border border-line bg-surface text-foreground',
  {
    variants: {
      variant: {
        /** Level 0 flat — border only */
        default: 'shadow-none',
        /** Level 1 raised content */
        raised: 'bg-surface-raised shadow-1',
        /** Translucent panel */
        glass: 'border-line/60 bg-surface/70 shadow-1 backdrop-blur-md',
        /** Earn mission cue — accent ring */
        mission: 'border-accent/45 bg-surface-raised shadow-1 ring-1 ring-accent/25 ring-inset',
        /** Wallet balance hero — aurora edge */
        'wallet-hero': 'border-accent/35 bg-surface-raised shadow-1 ring-1 ring-accent/20',
        /** VIP / tier ramp border */
        vip: 'border-2 border-[color:var(--ds-tier-gold)] bg-surface-raised shadow-1',
        /** Trade dense — line-first, no raise */
        'trade-dense': 'rounded-(--ds-radius-sm) border-line bg-surface shadow-none',
        /** Casino tile — float on hover (L1) */
        'casino-play':
          'bg-surface-raised shadow-1 transition-[transform,box-shadow] duration-(--ds-motion-surface) hover:-translate-y-0.5 hover:shadow-2 motion-reduce:transform-none motion-reduce:hover:translate-y-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      data-card-variant={variant ?? 'default'}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-4 pb-0', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-foreground-muted', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-4', className)} {...props} />,
);
CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-4 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';
