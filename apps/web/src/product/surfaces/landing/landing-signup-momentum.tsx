import { useEffect, useState } from 'react';

import {
  nudgePresentationSignupConcurrency,
  resolvePresentationSignupConcurrency,
} from '@/domain/landing-member-bot';
import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

export type LandingSignupMomentumProps = {
  className?: string;
};

/** Presentation signup concurrency bot — no LIVE badge (§28.7). */
export function LandingSignupMomentum({ className }: LandingSignupMomentumProps) {
  const t = useT();
  const [count, setCount] = useState(() => resolvePresentationSignupConcurrency());

  useEffect(() => {
    const tick = () => setCount((value) => nudgePresentationSignupConcurrency(value));
    const delayMs = 11_000 + Math.floor(Math.random() * 7_000);
    const timer = window.setInterval(tick, delayMs);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <p
      className={cn(
        'text-foreground m-0 text-sm font-medium tabular-nums [word-break:keep-all]',
        className,
      )}
      data-testid="landing-signup-momentum"
      aria-live="polite"
    >
      {t('landing.proof.signupMomentum', { count: count.toLocaleString('en-US') })}
    </p>
  );
}
