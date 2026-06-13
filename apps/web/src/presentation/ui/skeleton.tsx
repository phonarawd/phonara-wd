import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-2xl bg-surface-2/80 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]', className)}
      aria-hidden="true"
      {...props}
    />
  );
}
