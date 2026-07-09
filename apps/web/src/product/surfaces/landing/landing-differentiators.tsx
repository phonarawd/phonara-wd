import { Check } from 'lucide-react';

import { LANDING_DIFFERENTIATOR_IDS, landingDiffLabelKey } from '@/domain/landing-display-contract';
import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

/** Benefit checklist — no competitor names (CVR §3.2). */
export function LandingDifferentiators({ className }: { className?: string }) {
  const t = useT();

  return (
    <section
      className={cn('flex flex-col gap-3', className)}
      data-testid="landing-differentiators"
      aria-label={t('landing.diff.ariaLabel')}
    >
      <ul className="m-0 flex list-none gap-2 overflow-x-auto p-0 pb-1 md:grid md:grid-cols-3 md:gap-3 md:overflow-visible md:pb-0 lg:grid-cols-5">
        {LANDING_DIFFERENTIATOR_IDS.map((id) => (
          <li
            key={id}
            className="border-line bg-surface flex shrink-0 items-center gap-2 rounded-(--ds-radius-lg) border px-3 py-2 md:shrink"
          >
            <Check className="text-accent size-4 shrink-0" aria-hidden />
            <span className="text-foreground text-sm font-medium whitespace-nowrap md:whitespace-normal">
              {t(landingDiffLabelKey(id))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
