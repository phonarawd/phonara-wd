import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { Icon, type IconName } from './icon';

export const missionItemVariants = cva(
  'flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2 transition-[background,border-color] duration-[var(--motion-duration-2)] ease-[var(--motion-ease-standard)]',
  {
    variants: {
      state: {
        pending: 'border-border bg-surface-2',
        active: 'border-primary/40 bg-primary/10',
        done: 'border-up/25 bg-up/8',
        locked: 'border-border/60 bg-surface/50 opacity-70',
      },
    },
    defaultVariants: { state: 'pending' },
  },
);

export interface MissionItemProps
  extends Omit<HTMLAttributes<HTMLLIElement>, 'title'>,
    VariantProps<typeof missionItemVariants> {
  icon?: IconName;
  title: ReactNode;
  description?: ReactNode;
  reward: ReactNode;
  status?: ReactNode;
}

export const MissionItem = forwardRef<HTMLLIElement, MissionItemProps>(function MissionItem(
  { icon = 'earn', title, description, reward, status, state, className, ...props },
  ref,
) {
  return (
    <li ref={ref} className={cn(missionItemVariants({ state }), className)} {...props}>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface text-primary"
        aria-hidden="true"
      >
        <Icon name={icon} size="sm" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-fg">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-5 text-muted">{description}</span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="rounded-full bg-up/12 px-2.5 py-1 text-sm font-medium tabular-nums text-up">
          {reward}
        </span>
        {status ? <span className="text-[0.68rem] text-muted">{status}</span> : null}
      </span>
    </li>
  );
});

MissionItem.displayName = 'MissionItem';
