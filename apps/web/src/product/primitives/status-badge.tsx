import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { useT } from '@/lib/i18n';
import { cn } from '@/product/primitives/lib/cn';

/** 6-state money grammar — unified across wallet · casino · admin queues (§25.2). */
export type MoneyStatusState =
  | 'pending'
  | 'reviewing'
  | 'settled'
  | 'failed'
  | 'halted'
  | 'rejected';

const STATUS_I18N: Record<MoneyStatusState, `ux.status.${MoneyStatusState}`> = {
  pending: 'ux.status.pending',
  reviewing: 'ux.status.reviewing',
  settled: 'ux.status.settled',
  failed: 'ux.status.failed',
  halted: 'ux.status.halted',
  rejected: 'ux.status.rejected',
};

const STATUS_ICON: Record<MoneyStatusState, LucideIcon> = {
  pending: Clock,
  reviewing: Loader2,
  settled: CheckCircle2,
  failed: XCircle,
  halted: Ban,
  rejected: AlertTriangle,
};

export const statusBadgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 rounded-(--ds-radius-full) px-2.5 py-0.5 text-xs font-medium',
    'transition-[background-color,color] duration-(--ds-motion-surface)',
  ].join(' '),
  {
    variants: {
      state: {
        pending: 'bg-surface-raised text-foreground-muted',
        reviewing: 'bg-info/15 text-info',
        settled: 'bg-success/15 text-success',
        failed: 'bg-danger/15 text-danger',
        halted: 'bg-warning/15 text-warning',
        rejected: 'bg-danger/15 text-danger',
      },
    },
    defaultVariants: {
      state: 'pending',
    },
  },
);

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  state: MoneyStatusState;
  className?: string;
  /** Override i18n label (rare — prefer state key). */
  label?: string;
}

export function StatusBadge({ state, className, label }: StatusBadgeProps) {
  const t = useT();
  const Icon = STATUS_ICON[state];
  const text = label ?? t(STATUS_I18N[state]);

  return (
    <span className={cn(statusBadgeVariants({ state }), className)}>
      <Icon
        className={cn('size-3.5 shrink-0', state === 'reviewing' && 'animate-spin')}
        aria-hidden
      />
      {text}
    </span>
  );
}
