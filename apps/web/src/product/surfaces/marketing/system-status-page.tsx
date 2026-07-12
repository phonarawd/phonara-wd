import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Activity } from 'lucide-react';

import {
  SYSTEM_STATUS_COMPONENT_TITLE_KEYS,
  SYSTEM_STATUS_ENGINE_TODO,
  SYSTEM_STATUS_SEO_DESCRIPTION_KEY,
  SYSTEM_STATUS_SEO_TITLE_KEY,
  SYSTEM_STATUS_UI_UNLOCK_TODO,
  failClosedPublicPlatformStatus,
  mapPublicStatusToBadgeState,
  resolveLaneLabelKey,
  resolveSummaryLabelKey,
  resolveSystemStatusAnnouncementsRoute,
  resolveSystemStatusBackRoute,
  type PublicPlatformStatus,
} from '@/domain/system-status-display-contract';
import { fetchPublicPlatformStatus } from '@/features/marketing/use-system-status';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { StatusBadge } from '@/product/primitives/status-badge';
import { cn } from '@/product/primitives/lib/cn';

import { MarketingPageLayout } from './marketing-page-layout';

/**
 * Canonical `/status` — live from `rpc_get_public_platform_status` (R4).
 * Fetch failure stays fail-closed unknown (C-02).
 */
export function SystemStatusPage() {
  const t = useT();
  const backRoute = resolveSystemStatusBackRoute();
  const announcementsRoute = resolveSystemStatusAnnouncementsRoute();
  const [status, setStatus] = useState<PublicPlatformStatus>(() => failClosedPublicPlatformStatus());

  useEffect(() => {
    document.title = t(SYSTEM_STATUS_SEO_TITLE_KEY);
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicPlatformStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const mode = status.source === 'live' ? 'live' : 'fail-closed';

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
        data-status-mode={mode}
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
              state={mapPublicStatusToBadgeState(status.overall)}
              label={t(resolveSummaryLabelKey(status.overall))}
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
              {status.lanes.map((lane) => (
                <li
                  key={lane.id}
                  className="border-border flex items-center justify-between gap-3 border-b py-3 last:border-b-0"
                  data-testid={`system-status-component-${lane.id}`}
                  data-lane-status={lane.status}
                  data-reason-category={lane.reasonCategory}
                >
                  <span className="text-foreground text-sm font-medium">
                    {t(SYSTEM_STATUS_COMPONENT_TITLE_KEYS[lane.id])}
                  </span>
                  <StatusBadge
                    state={mapPublicStatusToBadgeState(lane.status)}
                    label={t(resolveLaneLabelKey(lane.status))}
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
