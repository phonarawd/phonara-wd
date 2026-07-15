import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';

import {
  buildFeesCashbackRows,
  FEES_CATEGORY_IDS,
  FEES_SEO_DESCRIPTION_KEY,
  FEES_SEO_TITLE_KEY,
  FEES_TIER_GUIDE_CTA_ROUTE,
  feesCategoryBodyKey,
  feesCategoryTitleKey,
} from '@/domain/fees-page-display-contract';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

import { MarketingPageLayout } from './marketing-page-layout';

/** Canonical public `/fees` — fee structure + tier cashback catalog (P12). */
export function FeesPage() {
  const t = useT();
  const cashbackRows = buildFeesCashbackRows();

  useEffect(() => {
    document.title = t(FEES_SEO_TITLE_KEY);
  }, [t]);

  return (
    <MarketingPageLayout
      testId="fees-page"
      eyebrow={t('fees.page.eyebrow')}
      title={t(FEES_SEO_TITLE_KEY)}
      lead={t(FEES_SEO_DESCRIPTION_KEY)}
    >
      <p
        className="text-foreground-muted m-0 text-sm leading-relaxed"
        data-testid="fees-page-notice"
      >
        {t('fees.page.settlementNotice')}
      </p>

      <section aria-labelledby="fees-categories-heading" data-testid="fees-categories">
        <h2 id="fees-categories-heading" className="text-foreground m-0 mb-3 text-lg font-semibold">
          {t('fees.page.categoriesTitle')}
        </h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {FEES_CATEGORY_IDS.map((id) => (
            <li key={id}>
              <Card data-testid={`fees-category-${id}`}>
                <CardBody className="flex flex-col gap-1">
                  <p className="text-foreground m-0 font-medium">{t(feesCategoryTitleKey(id))}</p>
                  <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                    {t(feesCategoryBodyKey(id))}
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="fees-cashback-heading" data-testid="fees-cashback-matrix">
        <h2 id="fees-cashback-heading" className="text-foreground m-0 mb-3 text-lg font-semibold">
          {t('fees.page.cashbackTitle')}
        </h2>
        <div className="border-border overflow-x-auto rounded-md border">
          <table className="w-full min-w-[16rem] border-collapse text-left text-sm">
            <thead className="bg-surface-raised">
              <tr>
                <th className="text-foreground-muted px-4 py-3 font-medium">
                  {t('tier.guide.table.tier')}
                </th>
                <th className="text-foreground-muted px-4 py-3 font-medium">
                  {t('tier.guide.table.cashback')}
                </th>
              </tr>
            </thead>
            <tbody>
              {cashbackRows.map((row) => (
                <tr
                  key={row.tier}
                  className="border-border border-t"
                  data-testid={`fees-cashback-${row.tier}`}
                >
                  <td className="text-foreground px-4 py-3 font-medium">
                    {t(`earn.tier.${row.tier}`)}
                  </td>
                  <td className="text-foreground px-4 py-3 tabular-nums">{t(row.cashbackKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Link
        to={FEES_TIER_GUIDE_CTA_ROUTE}
        className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'w-fit')}
        data-testid="fees-tier-cta"
      >
        {t('fees.page.tierCta')}
      </Link>
    </MarketingPageLayout>
  );
}
