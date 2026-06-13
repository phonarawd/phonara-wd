import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { AnimatedNumber, type DecimalLike } from './animated-number';

export const assetCardVariants = cva(
  'rounded-2xl border p-4 transition-[border-color,box-shadow] duration-[var(--motion-duration-2)] ease-[var(--motion-ease-standard)]',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-surface',
        primary: 'border-primary/25 bg-primary/8 shadow-[var(--primary-glow)]',
        up: 'border-up/25 bg-up/8',
      },
      emphasis: {
        default: '',
        hero: 'p-5',
      },
    },
    defaultVariants: { tone: 'neutral', emphasis: 'default' },
  },
);

export interface AssetCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof assetCardVariants> {
  label: ReactNode;
  amount: DecimalLike;
  formatAmount?: (value: string) => string;
  footer?: ReactNode;
  badge?: ReactNode;
}

export const AssetCard = forwardRef<HTMLDivElement, AssetCardProps>(function AssetCard(
  { label, amount, formatAmount, footer, badge, tone, emphasis, className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn(assetCardVariants({ tone, emphasis }), className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted">{label}</p>
        {badge}
      </div>
      <AnimatedNumber
        value={amount}
        format={formatAmount}
        emphasis={emphasis === 'hero' ? 'hero' : 'title'}
        tone={tone === 'up' ? 'up' : tone === 'primary' ? 'primary' : 'neutral'}
        className="mt-2 block"
      />
      {footer ? <div className="mt-3 border-t border-border/60 pt-3 text-sm text-muted">{footer}</div> : null}
    </div>
  );
});

AssetCard.displayName = 'AssetCard';
