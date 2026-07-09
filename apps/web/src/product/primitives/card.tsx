import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/product/primitives/lib/cn';

/**
 * Card CVA — elevation ladder (§34.7–34.8) + domain personalities (§34.17).
 * Domain variants: mission · wallet-hero · vip · trade-dense · sports-odds · casino-play.
 * Signature CSS: `tokens/domain-card-personalities.css` (glow / aurora edge / heatmap).
 */
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
        /** Earn mission — accent ring + progress glow (§34.17) */
        mission: 'border-accent/45 bg-surface-raised shadow-1 ring-1 ring-accent/30 ring-inset',
        /** Wallet balance hero — mono + aurora edge (§34.17) */
        'wallet-hero': 'border-accent/40 bg-surface-raised shadow-1 ring-1 ring-accent/25',
        /** VIP / tier ramp border (§34.17) — set --ds-card-tier on host */
        vip: 'border-2 border-[color:var(--ds-card-tier,var(--ds-tier-gold))] bg-surface-raised shadow-1',
        /** Trade dense — line-first, no raise (§34.17) */
        'trade-dense': 'rounded-(--ds-radius-sm) border-line bg-surface shadow-none',
        /** Sports odds — heatmap movement bg (§34.17) */
        'sports-odds': 'rounded-(--ds-radius-md) border-line bg-surface shadow-none',
        /** Casino tile — hover glow + float L1 (§34.17) */
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
