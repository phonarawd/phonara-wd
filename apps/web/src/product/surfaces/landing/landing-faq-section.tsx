import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import {
  LANDING_FAQ_ALL_IDS,
  landingFaqAnswerKey,
  landingFaqQuestionKey,
  type LandingFaqId,
} from '@/domain/landing-display-contract';
import { landingAnalyticsEventWithPayload } from '@/domain/landing-analytics-display-contract';
import { LandingAnalyticsSection } from '@/features/landing/landing-analytics-section';
import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

function FaqItem({ id }: { id: LandingFaqId }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const panelId = `landing-faq-${id}`;

  return (
    <div
      className="border-line rounded-(--ds-radius-lg) border"
      data-testid={`landing-faq-item-${id}`}
    >
      <button
        type="button"
        className={cn(
          'flex w-full items-center justify-between gap-3 p-4 text-left',
          'transition-colors duration-(--ds-motion-press) hover:bg-surface-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ds-focus)',
        )}
        aria-expanded={open}
        aria-controls={panelId}
        {...landingAnalyticsEventWithPayload('landing.faq.expand', { id })}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-foreground text-base font-semibold">
          {t(landingFaqQuestionKey(id))}
        </span>
        <ChevronDown
          className={cn(
            'text-foreground-muted size-5 shrink-0 transition-transform duration-(--ds-motion-surface)',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={panelId} className="border-line border-t px-4 pb-4 pt-3">
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(landingFaqAnswerKey(id))}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** FAQ accordion — 8 core + 3 bonus · anxiety-order · emoji in question copy (CVR §7). */
export function LandingFaqSection({ className }: { className?: string }) {
  const t = useT();

  return (
    <LandingAnalyticsSection
      event="landing.faq.viewed"
      className={cn('flex flex-col gap-4', className)}
      testId="landing-faq"
    >
      <h2 className="text-foreground m-0 text-2xl font-semibold">{t('landing.faq.title')}</h2>
      <div className="flex flex-col gap-3">
        {LANDING_FAQ_ALL_IDS.map((id) => (
          <FaqItem key={id} id={id} />
        ))}
      </div>
    </LandingAnalyticsSection>
  );
}
