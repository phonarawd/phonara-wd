import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn('grid gap-3 rounded-3xl border border-border bg-surface/80 p-5 text-center', className)}
      {...props}
    >
      <div className="grid gap-1">
        <p className="text-base font-semibold text-fg">{title}</p>
        {description ? <p className="text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex justify-center">{action}</div> : null}
    </div>
  );
}
