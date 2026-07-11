import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { MessageSquare } from 'lucide-react';

import {
  SUPPORT_HUB_ROUTE,
  SUPPORT_TICKET_DEFER_BODY_KEY,
  SUPPORT_TICKET_DEFER_TITLE_KEY,
  SUPPORT_TICKET_ENGINE_TODO,
  SUPPORT_TICKET_SEO_DESCRIPTION_KEY,
  SUPPORT_TICKET_SEO_TITLE_KEY,
  SUPPORT_TICKET_UI_UNLOCK_TODO,
  shouldDeferSupportTicket,
} from '@/domain/support-hub-display-contract';
import { useT } from '@/product/i18n';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';

import { MarketingPageLayout } from './marketing-page-layout';

/** Canonical `/support/ticket` STUB — E9 support tickets (P12). */
export function SupportTicketStubPage() {
  const t = useT();
  const deferred = shouldDeferSupportTicket();

  useEffect(() => {
    document.title = t(SUPPORT_TICKET_SEO_TITLE_KEY);
  }, [t]);

  return (
    <MarketingPageLayout
      testId="support-ticket-stub-page"
      eyebrow={t('support.ticket.eyebrow')}
      title={t(SUPPORT_TICKET_SEO_TITLE_KEY)}
      lead={t(SUPPORT_TICKET_SEO_DESCRIPTION_KEY)}
      backTo={SUPPORT_HUB_ROUTE}
      backLabelKey="support.faq.hubCta"
      className="data-deferred:opacity-100"
    >
      <div
        data-engine-todo={SUPPORT_TICKET_ENGINE_TODO}
        data-ui-unlock-todo={SUPPORT_TICKET_UI_UNLOCK_TODO}
        data-deferred={deferred ? 'true' : 'false'}
        data-testid="support-ticket-stub"
      >
        <Card data-testid="support-ticket-strip" className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <div className="bg-accent/15 text-accent flex size-10 items-center justify-center rounded-full">
                <MessageSquare className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">{t('support.ticket.strip.title')}</CardTitle>
                <CardDescription>{t('support.ticket.strip.body')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0" />
        </Card>

        <EmptyState
          title={t(SUPPORT_TICKET_DEFER_TITLE_KEY)}
          description={t(SUPPORT_TICKET_DEFER_BODY_KEY)}
          actionLabel={t('support.ticket.backToSupport')}
          onAction={() => {
            window.location.assign(SUPPORT_HUB_ROUTE);
          }}
          testId="support-ticket-empty"
        />

        <Link
          to={SUPPORT_HUB_ROUTE}
          className="text-accent mt-4 inline-flex text-sm font-medium underline-offset-4 hover:underline"
          data-testid="support-ticket-hub-link"
        >
          {t('support.ticket.backToSupport')}
        </Link>
      </div>
    </MarketingPageLayout>
  );
}
