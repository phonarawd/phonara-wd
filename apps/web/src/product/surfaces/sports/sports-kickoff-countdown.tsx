import { useEffect, useState } from 'react';

import {
  resolveKickoffCountdown,
  type KickoffCountdownView,
} from '@/domain/da-w8-signature-surfaces-display-contract';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';
import type { MessageKey } from '@phonara/i18n';

type SportsKickoffCountdownProps = {
  kickoffAt: string;
  /** Static kickoff label when reduced-motion or already started. */
  staticLabel: string;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  className?: string;
  'data-testid'?: string;
};

function readCountdown(kickoffAt: string, nowMs: number): KickoffCountdownView {
  return resolveKickoffCountdown(kickoffAt, nowMs);
}

/**
 * §34.25 Sports signature — live kickoff countdown (display-only).
 * Reduced-motion → static kickoff string · no decorative loop on bet submit.
 */
export function SportsKickoffCountdown({
  kickoffAt,
  staticLabel,
  t,
  className,
  'data-testid': testId = 'sports-kickoff-countdown',
}: SportsKickoffCountdownProps) {
  const prefersReduced = usePrefersReducedMotion();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (prefersReduced) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [prefersReduced]);

  if (prefersReduced) {
    return (
      <span
        className={cn('tabular-nums', className)}
        data-testid={testId}
        data-signature="kickoff-countdown"
        data-countdown="static"
      >
        {staticLabel}
      </span>
    );
  }

  const view = readCountdown(kickoffAt, nowMs);

  if (view.kind === 'invalid' || view.kind === 'started') {
    return (
      <span
        className={cn('tabular-nums', className)}
        data-testid={testId}
        data-signature="kickoff-countdown"
        data-countdown={view.kind}
      >
        {view.kind === 'started' ? t('sports.fixture.kickoffStarted') : staticLabel}
      </span>
    );
  }

  return (
    <span
      className={cn('tabular-nums', className)}
      data-testid={testId}
      data-signature="kickoff-countdown"
      data-countdown="live"
      data-remaining-seconds={view.totalSeconds}
    >
      {t('sports.fixture.kickoffIn', { countdown: view.clock })}
    </span>
  );
}
