import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Badge } from './badge';
import { Icon } from './icon';

export interface ProvablyFairBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  status?: 'pending' | 'verified' | 'mismatch';
}

export const ProvablyFairBadge = forwardRef<HTMLSpanElement, ProvablyFairBadgeProps>(
  function ProvablyFairBadge({ children, status = 'verified', className, ...props }, ref) {
    const tone = status === 'mismatch' ? 'down' : status === 'pending' ? 'neutral' : 'primary';
    return (
      <Badge
        ref={ref}
        tone={tone}
        size="sm"
        density="compact"
        className={cn('gap-1.5', className)}
        {...props}
      >
        <Icon name={status === 'mismatch' ? 'alert' : status === 'pending' ? 'activity' : 'shield'} size="xs" />
        {children}
      </Badge>
    );
  },
);

ProvablyFairBadge.displayName = 'ProvablyFairBadge';
