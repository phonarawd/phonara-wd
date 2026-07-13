import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { MessageSquare } from 'lucide-react';

import {
  resolveSupportTicketCategoryKey,
  resolveSupportTicketStatusKey,
  SUPPORT_TICKET_SEO_DESCRIPTION_KEY,
  SUPPORT_TICKET_SEO_TITLE_KEY,
  SUPPORT_TICKET_UI_UNLOCK_TODO,
} from '@/domain/support-ticket-display-contract';
import {
  SUPPORT_HUB_ROUTE,
  SUPPORT_TICKET_ENGINE_TODO,
  SUPPORT_TICKET_ROUTE,
} from '@/domain/support-hub-display-contract';
import { useSupportTicketController } from '@/features/support/use-support-ticket-controller';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/product/primitives/dialog';
import { Input } from '@/product/primitives/input';
import { Skeleton } from '@/product/primitives/skeleton';
import { StatusBadge } from '@/product/primitives/status-badge';

import { MarketingPageLayout } from './marketing-page-layout';

/** Canonical `/support/ticket` — E10 live support intake + history. */
export function SupportTicketPage() {
  const engine = useSupportTicketController();
  const { t } = engine;

  useEffect(() => {
    document.title = t(SUPPORT_TICKET_SEO_TITLE_KEY);
  }, [t]);

  return (
    <MarketingPageLayout
      testId="support-ticket-page"
      eyebrow={t('support.ticket.eyebrow')}
      title={t(SUPPORT_TICKET_SEO_TITLE_KEY)}
      lead={t(SUPPORT_TICKET_SEO_DESCRIPTION_KEY)}
      backTo={SUPPORT_HUB_ROUTE}
      backLabelKey="support.faq.hubCta"
    >
      <div
        data-engine-todo={SUPPORT_TICKET_ENGINE_TODO}
        data-ui-unlock-todo={SUPPORT_TICKET_UI_UNLOCK_TODO}
        data-route={SUPPORT_TICKET_ROUTE}
        data-testid="support-ticket-live"
      >
        <Card data-testid="support-ticket-form" className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <div className="bg-accent/15 text-accent flex size-10 items-center justify-center rounded-full">
                <MessageSquare className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">{t('support.ticket.form.title')}</CardTitle>
                <CardDescription>{t('support.ticket.form.body')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4 pt-0">
            <label className="flex flex-col gap-2">
              <span className="text-foreground-muted text-sm">
                {t('support.ticket.field.category')}
              </span>
              <select
                className="border-border bg-background text-foreground rounded-md border px-3 py-2 text-sm"
                value={engine.category}
                onChange={(event) =>
                  engine.setCategory(event.target.value as typeof engine.category)
                }
                data-testid="support-ticket-category"
              >
                {engine.categories.map((item) => (
                  <option key={item} value={item}>
                    {t(resolveSupportTicketCategoryKey(item))}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-foreground-muted text-sm">
                {t('support.ticket.field.subject')}
              </span>
              <Input
                value={engine.subject}
                onChange={(event) => engine.setSubject(event.target.value)}
                maxLength={200}
                data-testid="support-ticket-subject"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-foreground-muted text-sm">
                {t('support.ticket.field.body')}
              </span>
              <textarea
                className="border-border bg-background text-foreground min-h-28 rounded-md border px-3 py-2 text-sm"
                value={engine.body}
                onChange={(event) => engine.setBody(event.target.value)}
                maxLength={8000}
                data-testid="support-ticket-body"
              />
            </label>

            {engine.submitErrorKey ? (
              <p
                className="text-danger m-0 text-sm"
                role="alert"
                data-testid="support-ticket-error"
              >
                {t(engine.submitErrorKey)}
              </p>
            ) : null}

            {engine.submitSuccess ? (
              <p className="text-accent m-0 text-sm" data-testid="support-ticket-success">
                {t('support.ticket.success')}
              </p>
            ) : null}

            <Button
              type="button"
              onClick={engine.openConfirm}
              disabled={engine.submitting}
              data-testid="support-ticket-submit"
            >
              {t('support.ticket.submit')}
            </Button>
          </CardBody>
        </Card>

        <Card data-testid="support-ticket-history">
          <CardHeader>
            <CardTitle className="text-base">{t('support.ticket.history.title')}</CardTitle>
            <CardDescription>{t('support.ticket.history.body')}</CardDescription>
          </CardHeader>
          <CardBody className="pt-0">
            {engine.ticketsLoading ? (
              <div className="flex flex-col gap-2" data-testid="support-ticket-history-loading">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : null}

            {!engine.ticketsLoading && engine.tickets.length === 0 ? (
              <p
                className="text-foreground-muted m-0 text-sm"
                data-testid="support-ticket-history-empty"
              >
                {t('support.ticket.history.empty')}
              </p>
            ) : null}

            {!engine.ticketsLoading && engine.tickets.length > 0 ? (
              <ul
                className="m-0 flex list-none flex-col gap-2 p-0"
                data-testid="support-ticket-history-list"
              >
                {engine.tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <Card data-testid={`support-ticket-row-${ticket.id}`}>
                      <CardBody className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-foreground m-0 truncate text-sm font-medium">
                            {ticket.subject}
                          </p>
                          <p className="text-foreground-muted m-0 text-xs">
                            {t(resolveSupportTicketCategoryKey(ticket.category))}
                          </p>
                        </div>
                        <StatusBadge
                          state="reviewing"
                          label={t(resolveSupportTicketStatusKey(ticket.status))}
                        />
                      </CardBody>
                    </Card>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardBody>
        </Card>

        <Link
          to={SUPPORT_HUB_ROUTE}
          className="text-accent mt-4 inline-flex text-sm font-medium underline-offset-4 hover:underline"
          data-testid="support-ticket-hub-link"
        >
          {t('support.ticket.backToSupport')}
        </Link>
      </div>

      <Dialog open={engine.confirmOpen} onOpenChange={(open) => !open && engine.closeConfirm()}>
        <DialogContent data-testid="support-ticket-confirm-dialog">
          <DialogHeader>
            <DialogTitle>{t('support.ticket.confirm.title')}</DialogTitle>
            <DialogDescription>{t('support.ticket.confirm.body')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={engine.closeConfirm}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => void engine.submitTicket()}
              disabled={engine.submitting}
              data-testid="support-ticket-confirm-submit"
            >
              {t('support.ticket.confirm.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MarketingPageLayout>
  );
}
