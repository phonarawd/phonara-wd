import { type ElementType, type HTMLAttributes } from 'react';

import { cn } from '@/product/primitives/lib/cn';

export type ContentShellProps<T extends ElementType = 'div'> = {
  as?: T;
  bleed?: boolean;
} & Omit<HTMLAttributes<HTMLElement>, 'as'>;

/**
 * Max-width content column with fluid gutters and safe-area padding (§3.0 ultra shell).
 * Use `bleed` for edge-to-edge stages (casino canvas, trade chart) inside a capped shell route.
 */
export function ContentShell<T extends ElementType = 'div'>({
  as,
  bleed = false,
  className,
  children,
  ...props
}: ContentShellProps<T>) {
  const Component = as ?? 'div';

  return (
    <Component
      className={cn(bleed ? 'ds-shell-bleed' : 'ds-shell-content-column', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export type ShellPageProps<T extends ElementType = 'main'> = {
  as?: T;
} & Omit<HTMLAttributes<HTMLElement>, 'as'>;

/** Full-viewport page wrapper — safe-area aware min-height shell. */
export function ShellPage<T extends ElementType = 'main'>({
  as,
  className,
  children,
  ...props
}: ShellPageProps<T>) {
  const Component = as ?? 'main';

  return (
    <Component className={cn('ds-shell-page', className)} {...props}>
      {children}
    </Component>
  );
}
