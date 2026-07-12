import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Activity } from 'lucide-react';

import {
  SYSTEM_STATUS_COMPONENT_IDS,
  SYSTEM_STATUS_COMPONENT_TITLE_KEYS,
  SYSTEM_STATUS_ENGINE_TODO,
  SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE,
  SYSTEM_STATUS_SEO_DESCRIPTION_KEY,
  SYSTEM_STATUS_SEO_TITLE_KEY,
  SYSTEM_STATUS_SUMMARY_UNKNOWN_KEY,
  SYSTEM_STATUS_UI_UNLOCK_TODO,
  SYSTEM_STATUS_UNKNOWN_KEY,
  resolveSystemStatusAnnouncementsRoute,
  resolveSystemStatusBackRoute,
} from '@/domain/system-status-display-contract';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { StatusBadge } from '@/product/primitives/status-badge';
import { cn } from '@/product/primitives/lib/cn';

import { MarketingPageLayout } from './marketing-page-layout';

/**
 * Canonical `/status` — fail-closed unknown until R4 public health aggregate (C-02).
 * Never render settled/operational badges without a verified live source.
 */
export function SystemStatusPage() {
  const t = useT();
  const backRoute = resolveSystemStatusBackRoute();
  const announcementsRoute = resolveSystemStatusAnnouncementsRoute();

  useEffect(() => {
    document.title = t(SYSTEM_STATUS_SEO_TITLE_KEY);
  }, [t]);

  return (
    <MarketingPageLayout
      testId="system-status-page"
      eyebrow={t('status.page.eyebrow')}
      title={t(SYSTEM_STATUS_SEO_TITLE_KEY)}
      lead={t(SYSTEM_STATUS_SEO_DESCRIPTION_KEY)}
      backTo={backRoute}
      backLabelKey="support.faq.hubCta"
    >
      <div
        data-engine-todo={SYSTEM_STATUS_ENGINE_TODO}
        data-ui-unlock-todo={SYSTEM_STATUS_UI_UNLOCK_TODO}
        data-testid="system-status-live"
        data-status-mode="fail-closed"
      >
        <Card data-testid="system-status-summary" className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <div className="bg-accent/15 text-accent flex size-10 items-center justify-center rounded-full">
                <Activity className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">{t('status.page.summary.title')}</CardTitle>
                <CardDescription>{t('status.page.summary.body')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <StatusBadge
              state={SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE}
              label={t(SYSTEM_STATUS_SUMMARY_UNKNOWN_KEY)}
            />
          </CardBody>
        </Card>

        <Card data-testid="system-status-components">
          <CardHeader>
            <CardTitle className="text-base">{t('status.page.components.title')}</CardTitle>
            <CardDescription>{t('status.page.components.body')}</CardDescription>
          </CardHeader>
          <CardBody className="pt-0">
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {SYSTEM_STATUS_COMPONENT_IDS.map((id) => (
                <li
                  key={id}
                  className="border-border flex items-center justify-between gap-3 border-b py-3 last:border-b-0"
                  data-testid={`system-status-component-${id}`}
                >
                  <span className="text-foreground text-sm font-medium">
                    {t(SYSTEM_STATUS_COMPONENT_TITLE_KEYS[id])}
                  </span>
                  <StatusBadge
                    state={SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE}
                    label={t(SYSTEM_STATUS_UNKNOWN_KEY)}
                  />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Link
          to={announcementsRoute}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mt-4 w-fit px-0')}
          data-testid="system-status-announcements-cta"
        >
          {t('status.page.announcementsCta')}
        </Link>

        <Link
          to={backRoute}
          className="text-accent mt-4 inline-flex text-sm font-medium underline-offset-4 hover:underline"
          data-testid="system-status-hub-link"
        >
          {t('status.page.backToSupport')}
        </Link>
      </div>
    </MarketingPageLayout>
  );
}
