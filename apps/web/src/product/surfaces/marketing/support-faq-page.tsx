import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';

import { FEEDBACK_ROUTE } from '@/domain/feedback-display-contract';
import {
  SUPPORT_FAQ_ITEM_IDS,
  SUPPORT_FAQ_SEO_DESCRIPTION_KEY,
  SUPPORT_FAQ_SEO_TITLE_KEY,
  SUPPORT_HUB_ROUTE,
  supportFaqAnswerKey,
  supportFaqQuestionKey,
} from '@/domain/support-hub-display-contract';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

import { MarketingPageLayout } from './marketing-page-layout';

/** Canonical public `/support/faq` — i18n FAQ catalog (P12). */
export function SupportFaqPage() {
  const t = useT();

  useEffect(() => {
    document.title = t(SUPPORT_FAQ_SEO_TITLE_KEY);
  }, [t]);

  return (
    <MarketingPageLayout
      testId="support-faq-page"
      eyebrow={t('support.faq.eyebrow')}
      title={t(SUPPORT_FAQ_SEO_TITLE_KEY)}
      lead={t(SUPPORT_FAQ_SEO_DESCRIPTION_KEY)}
      backTo={SUPPORT_HUB_ROUTE}
      backLabelKey="support.faq.hubCta"
    >
      <ul className="m-0 flex list-none flex-col gap-3 p-0" data-testid="support-faq-list">
        {SUPPORT_FAQ_ITEM_IDS.map((id) => (
          <li key={id}>
            <Card data-testid={`support-faq-item-${id}`}>
              <CardBody className="flex flex-col gap-2">
                <p className="text-foreground m-0 font-medium">{t(supportFaqQuestionKey(id))}</p>
                <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                  {t(supportFaqAnswerKey(id))}
                </p>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>

      <p className="text-foreground-muted m-0 text-sm" data-testid="support-faq-contact">
        {t('faq.contact')}
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          to={SUPPORT_HUB_ROUTE}
          className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'w-fit')}
          data-testid="support-faq-hub-cta"
        >
          {t('support.faq.hubCta')}
        </Link>
        <Link
          to={FEEDBACK_ROUTE}
          className={cn(buttonVariants({ variant: 'ghost', size: 'md' }), 'w-fit')}
          data-testid="support-faq-feedback-cta"
        >
          {t('support.faq.feedbackCta')}
        </Link>
      </div>
    </MarketingPageLayout>
  );
}
