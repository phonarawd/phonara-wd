import type { ReactNode } from 'react';

import type { MissionCardDisplayState } from '@/domain/viral-missions-display-contract';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';
import { ProgressRing } from '@/product/primitives/progress-ring';

export interface MissionCardProps {
  title: string;
  description?: string;
  /** Co-primary PHON + fiat reward slot — takes precedence over `description`. */
  rewardSlot?: ReactNode;
  state: MissionCardDisplayState;
  progress?: number;
  progressLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  /** §32.7 — disabled+reason when engine gap blocks action (no dead claim CTA). */
  unavailableReason?: string;
  className?: string;
}

const STATE_RING: Record<MissionCardDisplayState, 'default' | 'accent' | 'success'> = {
  in_progress: 'accent',
  reward_pending: 'default',
  completed: 'success',
};

/** §13.10.5 mission card 3-state shell (Card + ProgressRing). */
export function MissionCard({
  title,
  description,
  rewardSlot,
  state,
  progress = 0,
  progressLabel,
  actionLabel,
  onAction,
  loading = false,
  unavailableReason,
  className,
}: MissionCardProps) {
  const showAction = state !== 'completed' && actionLabel && onAction && !unavailableReason;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <Card
      variant="mission"
      className={cn(
        'transition-[border-color,opacity] duration-(--ds-motion-surface)',
        state === 'completed' && 'border-success/40 opacity-90',
        className,
      )}
    >
      <CardHeader className="flex-row items-start gap-4 pb-0">
        <ProgressRing
          value={clampedProgress}
          size={56}
          strokeWidth={4}
          tone={STATE_RING[state]}
          aria-label={progressLabel ?? title}
        />
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {rewardSlot ? <div className="mt-1">{rewardSlot}</div> : null}
          {!rewardSlot && description ? (
            <p className="mt-1 text-sm text-foreground-muted">{description}</p>
          ) : null}
        </div>
      </CardHeader>
      {progressLabel ? (
        <CardBody className="pb-2 pt-3">
          <p className="text-xs text-foreground-muted">{progressLabel}</p>
        </CardBody>
      ) : null}
      {unavailableReason ? (
        <CardBody className="pb-2 pt-0">
          <p className="text-foreground-muted m-0 text-xs leading-relaxed" role="status">
            {unavailableReason}
          </p>
        </CardBody>
      ) : null}
      {showAction ? (
        <CardFooter>
          <Button
            variant={state === 'reward_pending' ? 'primary' : 'secondary'}
            size="md"
            className="w-full"
            loading={loading}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
