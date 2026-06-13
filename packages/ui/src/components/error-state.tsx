import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import type { ButtonProps } from './button';
import { StateSurface } from './state-surface';

export interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  actionLabel?: ReactNode;
  onAction?: ButtonProps['onClick'];
}

export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(function ErrorState(
  { title, description, actionLabel, onAction, className, ...props },
  ref,
) {
  return (
    <StateSurface
      ref={ref}
      state="error"
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      className={className}
      {...props}
    />
  );
});

ErrorState.displayName = 'ErrorState';
