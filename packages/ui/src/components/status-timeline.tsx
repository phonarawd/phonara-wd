import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface StatusTimelineItem {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  state?: 'pending' | 'active' | 'done' | 'success' | 'warning' | 'error' | 'offline' | 'reconnecting';
}

export interface StatusTimelineProps extends HTMLAttributes<HTMLOListElement> {
  items: StatusTimelineItem[];
}

export const StatusTimeline = forwardRef<HTMLOListElement, StatusTimelineProps>(
  function StatusTimeline({ items, className, ...props }, ref) {
    return (
      <ol ref={ref} className={cn('flex flex-col gap-3', className)} {...props}>
        {items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <span
              className={cn(
                'mt-0.5 h-3 w-3 rounded-full border',
                (item.state === 'done' || item.state === 'success') && 'border-up bg-up',
                item.state === 'active' && 'border-primary bg-primary',
                item.state === 'warning' && 'border-warning bg-warning',
                item.state === 'error' && 'border-down bg-down',
                item.state === 'offline' && 'border-border-strong bg-surface-inset',
                item.state === 'reconnecting' && 'border-primary bg-primary/40 animate-pulse',
                (!item.state || item.state === 'pending') && 'border-border bg-surface-2',
              )}
            />
            <span>
              <span className="block text-sm font-semibold text-fg">{item.label}</span>
              {item.description && <span className="block text-xs text-muted">{item.description}</span>}
            </span>
          </li>
        ))}
      </ol>
    );
  },
);

StatusTimeline.displayName = 'StatusTimeline';
