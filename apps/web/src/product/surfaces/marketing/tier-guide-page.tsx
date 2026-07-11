import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Crown } from 'lucide-react';

import {
  TIER_GUIDE_SEO_DESCRIPTION_KEY,
  TIER_GUIDE_SEO_TITLE_KEY,
  TIER_GUIDE_SUBTITLE_KEY,
  TIER_GUIDE_TITLE_KEY,
  TIER_GUIDE_TABLE_COLUMNS,
  tierGuideFaqAnswerKey,
  tierGuideFaqQuestionKey,
  tierGuideTableHeaderKey,
} from '@/domain/tier-guide-display-contract';
import { resolveTierCssVar } from '@/domain/tier-me-display-contract';
import { useTierGuidePageController } from '@/features/earn/use-tier-guide-page-controller';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

import { MarketingPageLayout } from './marketing-page-layout';

/** Canonical public `/tier` — VIP ladder marketing (P12). */
export function TierGuidePage() {
  const engine = useTierGuidePageController();
  const { t, loading, error, authenticated, currentTier, rows, faqIds } = engine;

  useEffect(() => {
    document.title = t(TIER_GUIDE_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-6"
        data-testid="tier-guide-loading"
      >
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const tierColorVar = currentTier ? resolveTierCssVar(currentTier) : null;

  return (
    <MarketingPageLayout
      testId="tier-guide-page"
      eyebrow={t('tier.guide.eyebrow')}
      title={t(TIER_GUIDE_TITLE_KEY)}
      lead={t(TIER_GUIDE_SUBTITLE_KEY)}
    >
      <p className="text-foreground-muted m-0 sr-only">{t(TIER_GUIDE_SEO_DESCRIPTION_KEY)}</p>

      {error ? (
        <p className="text-danger m-0 text-sm" role="alert" data-testid="tier-guide-error">
          {t(error)}
        </p>
      ) : null}

      {authenticated && currentTier ? (
        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
          style={
            tierColorVar
              ? {
                  background: `color-mix(in oklch, var(${tierColorVar}) 18%, transparent)`,
                  color: `var(${tierColorVar})`,
                }
              : undefined
          }
          data-testid="tier-guide-current-badge"
        >
          <Crown className="size-4" aria-hidden />
          {t('tier.guide.currentBadge')}: {t(`earn.tier.${currentTier}`)}
        </span>
      ) : null}

      <section aria-labelledby="tier-guide-matrix-heading" data-testid="tier-guide-matrix">
        <h2
          id="tier-guide-matrix-heading"
          className="text-foreground m-0 mb-3 text-lg font-semibold"
        >
          {t('tier.guide.matrixTitle')}
        </h2>
        <div className="border-border overflow-x-auto rounded-md border">
          <table className="w-full min-w-xl border-collapse text-left text-sm">
            <thead className="bg-surface-raised">
              <tr>
                {TIER_GUIDE_TABLE_COLUMNS.map((column) => (
                  <th key={column} className="text-foreground-muted px-3 py-3 font-medium">
                    {t(tierGuideTableHeaderKey(column))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.tier}
                  className={cn('border-border border-t', row.current ? 'bg-accent/5' : undefined)}
                  data-testid={`tier-guide-row-${row.tier}`}
                  data-current={row.current ? 'true' : 'false'}
                >
                  <td className="text-foreground px-3 py-3 font-medium">
                    {t(row.tierLabelKey)}
                    {row.current ? (
                      <span className="text-accent ml-2 text-xs font-semibold">
                        {t('tier.guide.currentBadge')}
                      </span>
                    ) : null}
                  </td>
                  <td className="text-foreground px-3 py-3 tabular-nums">{t(row.thresholdKey)}</td>
                  <td className="text-foreground px-3 py-3 tabular-nums">{t(row.cashbackKey)}</td>
                  <td className="text-foreground px-3 py-3 tabular-nums">{t(row.withdrawKey)}</td>
                  <td className="text-foreground px-3 py-3 tabular-nums">{t(row.bonusKey)}</td>
                  <td className="text-foreground px-3 py-3">{t(row.supportKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="tier-guide-faq-heading" data-testid="tier-guide-faq">
        <h2 id="tier-guide-faq-heading" className="text-foreground m-0 mb-3 text-lg font-semibold">
          {t('tier.guide.faq.heading')}
        </h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {faqIds.map((id) => (
            <li key={id}>
              <Card>
                <CardBody className="flex flex-col gap-1">
                  <p className="text-foreground m-0 font-medium">{t(tierGuideFaqQuestionKey(id))}</p>
                  <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                    {t(tierGuideFaqAnswerKey(id))}
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/tier/benefits"
          className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'w-fit')}
          data-testid="tier-guide-benefits-cta"
        >
          {t('tier.guide.benefitsCta')}
        </Link>
        <Link
          to="/signup"
          className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-fit')}
          data-testid="tier-guide-signup-cta"
        >
          {t('tier.guide.signupCta')}
        </Link>
      </div>
    </MarketingPageLayout>
  );
}
