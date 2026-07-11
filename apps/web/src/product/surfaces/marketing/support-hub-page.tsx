import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Mail, MessageSquare } from 'lucide-react';

import { FEEDBACK_ROUTE } from '@/domain/feedback-display-contract';
import {
  SUPPORT_CONTACT_EMAIL,
  SUPPORT_FAQ_ROUTE,
  SUPPORT_HUB_SEO_DESCRIPTION_KEY,
  SUPPORT_HUB_SEO_TITLE_KEY,
  SUPPORT_TICKET_ROUTE,
  buildSupportMailtoHref,
  shouldDeferSupportTicket,
} from '@/domain/support-hub-display-contract';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

import { MarketingPageLayout } from './marketing-page-layout';

/** Canonical public `/support` — mailto hub + FAQ/feedback links (P12). */
export function SupportHubPage() {
  const t = useT();
  const ticketDeferred = shouldDeferSupportTicket();
  const mailtoHref = buildSupportMailtoHref(t('support.hub.mailtoSubject'));

  useEffect(() => {
    document.title = t(SUPPORT_HUB_SEO_TITLE_KEY);
  }, [t]);

  return (
    <MarketingPageLayout
      testId="support-hub-page"
      eyebrow={t('support.hub.eyebrow')}
      title={t(SUPPORT_HUB_SEO_TITLE_KEY)}
      lead={t(SUPPORT_HUB_SEO_DESCRIPTION_KEY)}
    >
      <Card data-testid="support-hub-contact">
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-accent/15 text-accent flex size-10 items-center justify-center rounded-full">
              <Mail className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground m-0 font-medium">{t('support.email.label')}</p>
              <p className="text-foreground-muted m-0 text-sm tabular-nums">
                {SUPPORT_CONTACT_EMAIL}
              </p>
              <p className="text-foreground-muted m-0 mt-1 text-sm">
                {t('support.hours.label')}: {t('support.hours.value')}
              </p>
            </div>
          </div>
          <a
            href={mailtoHref}
            className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-fit')}
            data-testid="support-hub-mailto"
          >
            {t('support.hub.mailtoCta')}
          </a>
          <p className="text-foreground-muted m-0 text-xs">{t('support.note')}</p>
        </CardBody>
      </Card>

      <ul className="m-0 flex list-none flex-col gap-3 p-0" data-testid="support-hub-links">
        <li>
          <Link
            to={SUPPORT_FAQ_ROUTE}
            className="border-border bg-surface-raised hover:border-accent/40 flex items-center gap-3 rounded-md border p-4 transition-colors"
            data-testid="support-hub-faq-link"
          >
            <div className="min-w-0 flex-1">
              <p className="text-foreground m-0 font-medium">{t('support.hub.faqCta')}</p>
              <p className="text-foreground-muted m-0 text-sm">{t('faq.subtitle')}</p>
            </div>
            <ChevronRight className="text-foreground-muted size-5 shrink-0" aria-hidden />
          </Link>
        </li>
        <li>
          <Link
            to={FEEDBACK_ROUTE}
            className="border-border bg-surface-raised hover:border-accent/40 flex items-center gap-3 rounded-md border p-4 transition-colors"
            data-testid="support-hub-feedback-link"
          >
            <div className="min-w-0 flex-1">
              <p className="text-foreground m-0 font-medium">{t('support.hub.feedbackCta')}</p>
              <p className="text-foreground-muted m-0 text-sm">{t('feedback.page.head.desc')}</p>
            </div>
            <ChevronRight className="text-foreground-muted size-5 shrink-0" aria-hidden />
          </Link>
        </li>
        <li>
          <Link
            to={SUPPORT_TICKET_ROUTE}
            className="border-border bg-surface-raised hover:border-accent/40 flex items-center gap-3 rounded-md border p-4 transition-colors"
            data-testid="support-hub-ticket-link"
            data-deferred={ticketDeferred ? 'true' : 'false'}
          >
            <div className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-full">
              <MessageSquare className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground m-0 font-medium">{t('support.hub.ticketCta')}</p>
              <p className="text-foreground-muted m-0 text-sm">
                {ticketDeferred ? t('support.hub.ticketDeferred') : t('support.hub.ticketLive')}
              </p>
            </div>
            <ChevronRight className="text-foreground-muted size-5 shrink-0" aria-hidden />
          </Link>
        </li>
      </ul>
    </MarketingPageLayout>
  );
}
