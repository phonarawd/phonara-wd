import type { MessageKey } from '@phonara/i18n';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

import {
  buildAmbientActivityLines,
  resolveAmbientRotationMs,
  type AmbientActivityLine,
} from './ambient-activity';

export type LiveActivityTickerProps = {
  lines?: readonly AmbientActivityLine[];
  className?: string;
};

function formatLine(
  line: AmbientActivityLine,
  t: (key: MessageKey, params?: Record<string, string>) => string,
): string {
  if (line.kind === 'signup') {
    return t('landing.proof.ambientSignup', { nick: line.maskedNick });
  }
  return `${line.maskedNick} · ${t(line.missionTitleKey)} · ${line.rewardLabel}`;
}

/** §28.7 L1 ambient ticker — no LIVE label · masked nick · catalog truth only. */
export function LiveActivityTicker({ lines, className }: LiveActivityTickerProps) {
  const t = useT();
  const reducedMotion = usePrefersReducedMotion();
  const activityLines = useMemo(
    () => (lines && lines.length > 0 ? [...lines] : buildAmbientActivityLines()),
    [lines],
  );
  const staticLines = activityLines.slice(0, 3);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion || activityLines.length <= 1) return;
    const tick = () => setIndex((value) => (value + 1) % activityLines.length);
    const intervalMs = resolveAmbientRotationMs();
    const timer = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(timer);
  }, [activityLines.length, reducedMotion]);

  if (reducedMotion) {
    return (
      <ul
        className={cn('m-0 flex list-none flex-col gap-2 p-0 text-sm', className)}
        aria-label={t('landing.proof.tickerAria')}
        data-testid="landing-activity-ticker-static"
      >
        {staticLines.map((line) => (
          <li key={line.id} className="text-foreground-muted tabular-nums">
            {formatLine(line, t)}
          </li>
        ))}
      </ul>
    );
  }

  const activeLine = activityLines[index] ?? activityLines[0]!;

  return (
    <div
      className={cn('relative min-h-11 overflow-hidden', className)}
      aria-live="polite"
      aria-atomic="true"
      aria-label={t('landing.proof.tickerAria')}
      data-testid="landing-activity-ticker"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={activeLine.id}
          className="text-foreground-muted m-0 text-sm tabular-nums"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {formatLine(activeLine, t)}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
