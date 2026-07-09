import { ArrowUpRight, Coins, Target, UserPlus, type LucideIcon } from 'lucide-react';

import {
  LANDING_WHY_FLOW_STEP_IDS,
  landingWhyFlowLabelKey,
  type LandingWhyFlowStepId,
} from '@/domain/landing-display-contract';
import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

const WHY_FLOW_ICONS: Readonly<Record<LandingWhyFlowStepId, LucideIcon>> = {
  signup: UserPlus,
  mission: Target,
  earn: Coins,
  withdraw: ArrowUpRight,
};

/** Hero subline + 4-step micro-flow — answers "why here?" within 3 seconds (CVR §3.1). */
export function LandingWhyStrip({ className }: { className?: string }) {
  const t = useT();

  return (
    <section
      className={cn('flex flex-col gap-4', className)}
      data-testid="landing-why-strip"
      aria-label={t('landing.why.ariaLabel')}
    >
      <p className="text-foreground m-0 text-base font-medium leading-snug [word-break:keep-all]">
        {t('landing.why.subline')}
      </p>
      <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 md:gap-3">
        {LANDING_WHY_FLOW_STEP_IDS.map((stepId, index) => {
          const Icon = WHY_FLOW_ICONS[stepId];
          return (
            <li key={stepId} className="flex items-center gap-2">
              <span
                className="bg-surface-raised text-accent flex size-8 shrink-0 items-center justify-center rounded-(--ds-radius-full)"
                aria-hidden
              >
                <Icon className="size-4" />
              </span>
              <span className="text-foreground text-sm font-medium">
                {t(landingWhyFlowLabelKey(stepId))}
              </span>
              {index < LANDING_WHY_FLOW_STEP_IDS.length - 1 ? (
                <span className="text-foreground-muted hidden px-1 text-xs md:inline" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="text-foreground-muted m-0 text-sm">{t('landing.why.noInvestment')}</p>
    </section>
  );
}
