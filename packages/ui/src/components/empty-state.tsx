import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import type { ButtonProps } from './button';
import { StateSurface } from './state-surface';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  actionLabel?: ReactNode;
  onAction?: ButtonProps['onClick'];
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, description, actionLabel, onAction, className, ...props },
  ref,
) {
  return (
    <StateSurface
      ref={ref}
      state="empty"
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      className={className}
      {...props}
    />
  );
});

EmptyState.displayName = 'EmptyState';
