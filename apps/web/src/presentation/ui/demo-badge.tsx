import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type DemoBadgeTone = 'default' | 'soon' | 'release';

type DemoBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  label: string;
  tone?: DemoBadgeTone;
};

const toneClassName: Record<DemoBadgeTone, string> = {
  default: 'border-primary/30 bg-primary/10 text-primary',
  soon: 'border-warning/30 bg-warning/10 text-warning',
  release: 'border-info/30 bg-info/10 text-info',
};

export function DemoBadge({ label, tone = 'default', className, ...props }: DemoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold tracking-tight',
        toneClassName[tone],
        className,
      )}
      {...props}
    >
      {label}
    </span>
  );
}
