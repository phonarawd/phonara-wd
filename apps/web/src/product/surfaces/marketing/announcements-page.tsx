import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';

import {
  ANNOUNCEMENTS_SEO_DESCRIPTION_KEY,
  ANNOUNCEMENTS_SEO_TITLE_KEY,
  mapRpcNoticeRow,
  type CmsNoticeRpcRow,
} from '@/domain/announcements-display-contract';
import { SUPPORT_HUB_ROUTE } from '@/domain/support-hub-display-contract';
import { useCmsNotices } from '@/hooks/use-cms-content';
import { useI18n, useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

import { MarketingPageLayout } from './marketing-page-layout';

/** Canonical public `/announcements` — CMS notice list (P12). */
export function AnnouncementsPage() {
  const t = useT();
  const { locale } = useI18n();
  const noticesQuery = useCmsNotices(locale);
  const rows = ((noticesQuery.data ?? []) as CmsNoticeRpcRow[]).map(mapRpcNoticeRow);

  useEffect(() => {
    document.title = t(ANNOUNCEMENTS_SEO_TITLE_KEY);
  }, [t]);

  return (
    <MarketingPageLayout
      testId="announcements-page"
      eyebrow={t('announcements.page.eyebrow')}
      title={t(ANNOUNCEMENTS_SEO_TITLE_KEY)}
      lead={t(ANNOUNCEMENTS_SEO_DESCRIPTION_KEY)}
    >
      {noticesQuery.isLoading ? (
        <div className="flex flex-col gap-3" data-testid="announcements-loading">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {noticesQuery.isError ? (
        <p className="text-danger m-0 text-sm" role="alert" data-testid="announcements-error">
          {t('announcements.page.error')}
        </p>
      ) : null}

      {!noticesQuery.isLoading && !noticesQuery.isError && rows.length === 0 ? (
        <EmptyState
          title={t('announcements.page.empty.title')}
          description={t('announcements.page.empty.body')}
          actionLabel={t('announcements.page.empty.action')}
          onAction={() => {
            window.location.assign(SUPPORT_HUB_ROUTE);
          }}
          testId="announcements-empty"
        />
      ) : null}

      {!noticesQuery.isLoading && rows.length > 0 ? (
        <ul
          className="m-0 flex list-none flex-col gap-3 p-0"
          data-testid="announcements-list"
        >
          {rows.map((row) => (
            <li key={row.id}>
              <Card data-testid={`announcement-row-${row.id}`}>
                <CardBody className="flex flex-col gap-2">
                  <p className="text-foreground m-0 font-medium">{row.title}</p>
                  {row.body ? (
                    <p className="text-foreground-muted m-0 text-sm leading-relaxed whitespace-pre-wrap">
                      {row.body}
                    </p>
                  ) : null}
                  {row.publishedAt ? (
                    <p className="text-foreground-muted m-0 text-xs tabular-nums">
                      {row.publishedAt}
                    </p>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        to={SUPPORT_HUB_ROUTE}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-fit px-0')}
        data-testid="announcements-support-cta"
      >
        {t('announcements.page.supportCta')}
      </Link>
    </MarketingPageLayout>
  );
}
