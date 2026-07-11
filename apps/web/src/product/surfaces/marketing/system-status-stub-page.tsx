import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Activity } from 'lucide-react';

import { SUPPORT_HUB_ROUTE } from '@/domain/support-hub-display-contract';
import {
  SYSTEM_STATUS_DEFER_BODY_KEY,
  SYSTEM_STATUS_DEFER_TITLE_KEY,
  SYSTEM_STATUS_ENGINE_TODO,
  SYSTEM_STATUS_SEO_DESCRIPTION_KEY,
  SYSTEM_STATUS_SEO_TITLE_KEY,
  SYSTEM_STATUS_UI_UNLOCK_TODO,
  resolveSystemStatusBackRoute,
  shouldDeferSystemStatus,
} from '@/domain/system-status-display-contract';
import { useT } from '@/product/i18n';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';

import { MarketingPageLayout } from './marketing-page-layout';

/** Canonical `/status` STUB — E10 public status page (P12). */
export function SystemStatusStubPage() {
  const t = useT();
  const deferred = shouldDeferSystemStatus();
  const backRoute = resolveSystemStatusBackRoute();

  useEffect(() => {
    document.title = t(SYSTEM_STATUS_SEO_TITLE_KEY);
  }, [t]);

  return (
    <MarketingPageLayout
      testId="system-status-stub-page"
      eyebrow={t('status.page.eyebrow')}
      title={t(SYSTEM_STATUS_SEO_TITLE_KEY)}
      lead={t(SYSTEM_STATUS_SEO_DESCRIPTION_KEY)}
      backTo={backRoute}
      backLabelKey="support.faq.hubCta"
    >
      <div
        data-engine-todo={SYSTEM_STATUS_ENGINE_TODO}
        data-ui-unlock-todo={SYSTEM_STATUS_UI_UNLOCK_TODO}
        data-deferred={deferred ? 'true' : 'false'}
        data-testid="system-status-stub"
      >
        <Card data-testid="system-status-strip" className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <div className="bg-accent/15 text-accent flex size-10 items-center justify-center rounded-full">
                <Activity className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">{t('status.page.strip.title')}</CardTitle>
                <CardDescription>{t('status.page.strip.body')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0" />
        </Card>

        <EmptyState
          title={t(SYSTEM_STATUS_DEFER_TITLE_KEY)}
          description={t(SYSTEM_STATUS_DEFER_BODY_KEY)}
          actionLabel={t('status.page.backToSupport')}
          onAction={() => {
            window.location.assign(SUPPORT_HUB_ROUTE);
          }}
          testId="system-status-empty"
        />

        <Link
          to={SUPPORT_HUB_ROUTE}
          className="text-accent mt-4 inline-flex text-sm font-medium underline-offset-4 hover:underline"
          data-testid="system-status-hub-link"
        >
          {t('status.page.backToSupport')}
        </Link>
      </div>
    </MarketingPageLayout>
  );
}
