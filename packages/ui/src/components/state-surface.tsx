import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { Button, type ButtonProps } from './button';
import { Icon, type IconName } from './icon';
import { Skeleton } from './skeleton';
import { Spinner } from './spinner';

export type SurfaceState =
  | 'loading'
  | 'skeleton'
  | 'empty'
  | 'success'
  | 'warning'
  | 'error'
  | 'offline'
  | 'reconnecting';

const stateIcon: Record<Exclude<SurfaceState, 'loading' | 'skeleton'>, IconName> = {
  empty: 'info',
  success: 'check',
  warning: 'alert',
  error: 'alert',
  offline: 'shield',
  reconnecting: 'activity',
};

export const stateSurfaceVariants = cva(
  'rounded-2xl border p-[var(--density-comfortable-panel-padding)] text-center shadow-[var(--surface-highlight)]',
  {
    variants: {
      state: {
        loading: 'border-border bg-surface/70',
        skeleton: 'border-border bg-surface/70',
        empty: 'border-dashed border-border bg-surface/60',
        success: 'border-up/35 bg-up/10',
        warning: 'border-warning/35 bg-warning/10',
        error: 'border-down/35 bg-down/10',
        offline: 'border-border-strong bg-surface-inset',
        reconnecting: 'border-primary/35 bg-primary/10',
      },
      density: {
        compact: 'p-[var(--density-compact-panel-padding)]',
        comfortable: 'p-[var(--density-comfortable-panel-padding)]',
      },
    },
    defaultVariants: {
      state: 'empty',
      density: 'comfortable',
    },
  },
);

export interface StateSurfaceProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof stateSurfaceVariants> {
  title?: ReactNode;
  description?: ReactNode;
  actionLabel?: ReactNode;
  onAction?: ButtonProps['onClick'];
  actionVariant?: ButtonProps['variant'];
  icon?: IconName;
  loadingLabel?: string;
}

export const StateSurface = forwardRef<HTMLDivElement, StateSurfaceProps>(function StateSurface(
  {
    state = 'empty',
    density,
    title,
    description,
    actionLabel,
    onAction,
    actionVariant,
    icon,
    loadingLabel,
    className,
    ...props
  },
  ref,
) {
  const resolvedState = state ?? 'empty';
  const isLoading = resolvedState === 'loading';
  const isSkeleton = resolvedState === 'skeleton';
  const role =
    resolvedState === 'error' || resolvedState === 'warning' || resolvedState === 'offline'
      ? 'alert'
      : 'status';
  const visualState =
    resolvedState === 'loading' || resolvedState === 'skeleton' ? 'empty' : resolvedState;

  return (
    <div
      ref={ref}
      role={role}
      aria-busy={isLoading || isSkeleton || undefined}
      className={cn(stateSurfaceVariants({ state: resolvedState, density }), className)}
      {...props}
    >
      {isSkeleton ? (
        <div className="mx-auto grid max-w-sm gap-3">
          <Skeleton shape="line" className="mx-auto w-1/2" />
          <Skeleton shape="line" className="mx-auto w-3/4" />
          <Skeleton shape="block" className="min-h-20" />
        </div>
      ) : (
        <>
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-2 text-primary shadow-[var(--elevation-1)]">
            {isLoading ? (
              <Spinner size="sm" label={loadingLabel} />
            ) : (
              <Icon name={icon ?? stateIcon[visualState]} size="md" />
            )}
          </span>
          {title ? <h3 className="mt-3 font-[var(--font-weight-heading)] text-fg">{title}</h3> : null}
          {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
          {actionLabel && onAction ? (
            <Button
              className="mt-4"
              size="sm"
              variant={actionVariant ?? (state === 'error' ? 'danger' : 'outline')}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
});

StateSurface.displayName = 'StateSurface';
