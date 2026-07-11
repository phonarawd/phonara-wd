import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Bug, Mail } from 'lucide-react';

import {
  FEEDBACK_FAQ_CTA_ROUTE,
  FEEDBACK_SEO_DESCRIPTION_KEY,
  FEEDBACK_SEO_TITLE_KEY,
  buildFeedbackMailtoHref,
  feedbackMailtoSubjectKey,
  isFeedbackBugType,
  type FeedbackPageType,
} from '@/domain/feedback-display-contract';
import { SUPPORT_CONTACT_EMAIL, SUPPORT_HUB_ROUTE } from '@/domain/support-hub-display-contract';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

import { MarketingPageLayout } from './marketing-page-layout';

export type FeedbackPageProps = {
  type?: FeedbackPageType;
};

/** Canonical public `/feedback` — mailto feedback · bug mode via `?type=bug` (P12). */
export function FeedbackPage({ type = 'general' }: FeedbackPageProps) {
  const t = useT();
  const isBug = isFeedbackBugType(type);
  const subject = t(feedbackMailtoSubjectKey(type));
  const mailtoHref = buildFeedbackMailtoHref(subject);

  useEffect(() => {
    document.title = isBug ? t('feedback.page.bug.title') : t(FEEDBACK_SEO_TITLE_KEY);
  }, [isBug, t]);

  return (
    <MarketingPageLayout
      testId="feedback-page"
      eyebrow={t('feedback.page.eyebrow')}
      title={isBug ? t('feedback.page.bug.title') : t(FEEDBACK_SEO_TITLE_KEY)}
      lead={isBug ? t('feedback.page.bug.desc') : t(FEEDBACK_SEO_DESCRIPTION_KEY)}
    >
      <Card data-testid={isBug ? 'feedback-bug-card' : 'feedback-general-card'}>
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-accent/15 text-accent flex size-10 items-center justify-center rounded-full">
              {isBug ? <Bug className="size-5" aria-hidden /> : <Mail className="size-5" aria-hidden />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground m-0 font-medium">{t('support.email.label')}</p>
              <p className="text-foreground-muted m-0 text-sm tabular-nums">{SUPPORT_CONTACT_EMAIL}</p>
            </div>
          </div>
          <a
            href={mailtoHref}
            className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-fit')}
            data-testid="feedback-mailto"
          >
            {t('feedback.page.mailtoCta')}
          </a>
          <p className="text-foreground-muted m-0 text-xs">{t('feedback.page.note')}</p>
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          to={FEEDBACK_FAQ_CTA_ROUTE}
          className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'w-fit')}
          data-testid="feedback-faq-cta"
        >
          {t('feedback.page.faqCta')}
        </Link>
        <Link
          to={SUPPORT_HUB_ROUTE}
          className={cn(buttonVariants({ variant: 'ghost', size: 'md' }), 'w-fit')}
          data-testid="feedback-hub-cta"
        >
          {t('feedback.page.hubCta')}
        </Link>
      </div>
    </MarketingPageLayout>
  );
}
