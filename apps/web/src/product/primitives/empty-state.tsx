import type { DaW6DomainEmptyDomain } from '../../domain/da-w6-brand-elevation-display-contract';
import { Button } from '@/product/primitives/button';
import { DomainEmptyMark } from '@/product/primitives/domain-empty-mark';
import { cn } from '@/product/primitives/lib/cn';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Next action — blank panel without CTA = FAIL (§25.2). */
  actionLabel: string;
  onAction: () => void;
  icon?: React.ReactNode;
  /** §34.19 domain personality — Casino chips · Trade pulse · Wallet vault · Sports stadium. */
  domain?: DaW6DomainEmptyDomain;
  className?: string;
  testId?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  domain,
  className,
  testId = 'empty-state',
}: EmptyStateProps) {
  const resolvedIcon = icon ?? (domain ? <DomainEmptyMark domain={domain} /> : null);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-line',
        'bg-surface px-6 py-10 text-center',
        className,
      )}
      data-testid={testId}
      data-domain={domain}
    >
      {resolvedIcon ? <div className="text-foreground-muted">{resolvedIcon}</div> : null}
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-sm text-foreground-muted">{description}</p> : null}
      </div>
      <Button variant="primary" size="md" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
