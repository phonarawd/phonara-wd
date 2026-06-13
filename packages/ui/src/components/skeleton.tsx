import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const skeletonVariants = cva(
  'animate-pulse bg-surface-2/70 shadow-[var(--surface-highlight)]',
  {
    variants: {
      shape: {
        line: 'h-4 rounded-full',
        block: 'min-h-24 rounded-2xl',
        circle: 'aspect-square rounded-full',
      },
      density: {
        compact: '',
        comfortable: '',
      },
    },
    defaultVariants: {
      shape: 'block',
      density: 'comfortable',
    },
  },
);

export interface SkeletonProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, shape, density, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(skeletonVariants({ shape, density }), className)}
      aria-hidden="true"
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';
