import type { HTMLAttributes } from 'react';

import { cn } from '@/product/primitives/lib/cn';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'skeleton-shimmer relative overflow-hidden rounded-(--ds-radius-md) bg-surface-raised',
        className,
      )}
      aria-hidden
      {...props}
    />
  );
}
