import { Button } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Next action — blank panel without CTA = FAIL (§25.2). */
  actionLabel: string;
  onAction: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-(--ds-radius-lg) border border-dashed border-line',
        'bg-surface px-6 py-10 text-center',
        className,
      )}
    >
      {icon ? <div className="text-foreground-muted">{icon}</div> : null}
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
