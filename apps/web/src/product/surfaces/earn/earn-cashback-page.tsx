import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Crown, Percent } from 'lucide-react';

import { EARN_HOME_CANONICAL_ROUTE } from '@/domain/earn-home-display-contract';
import {
  EARN_CASHBACK_SEO_DESCRIPTION_KEY,
  EARN_CASHBACK_SEO_TITLE_KEY,
} from '@/domain/earn-cashback-display-contract';
import { resolveTierCssVar } from '@/domain/tier-me-display-contract';
import { useEarnCashbackPageController } from '@/features/earn/use-earn-cashback-page-controller';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

/** Canonical `/earn/cashback` — tier cashback % display (P11). */
export function EarnCashbackPage() {
  const engine = useEarnCashbackPageController();
  const { t, loading, error, currentTier, currentCashbackKey, rows } = engine;

  useEffect(() => {
    document.title = t(EARN_CASHBACK_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4"
        data-testid="earn-cashback-loading"
      >
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const tierColorVar = resolveTierCssVar(currentTier);

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4 md:py-6"
      data-testid="earn-cashback-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to={EARN_HOME_CANONICAL_ROUTE}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'text-foreground-muted w-fit px-0',
          )}
          data-testid="earn-cashback-back"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('earn.cashback.backToHome')}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t(EARN_CASHBACK_SEO_TITLE_KEY)}
          </h1>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
            style={{
              background: `color-mix(in oklch, var(${tierColorVar}) 18%, transparent)`,
              color: `var(${tierColorVar})`,
            }}
            data-testid="earn-cashback-current-badge"
          >
            <Crown className="size-4" aria-hidden />
            {t(`earn.tier.${currentTier}`)}
          </span>
        </div>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">
          {t(EARN_CASHBACK_SEO_DESCRIPTION_KEY)}
        </p>
      </header>

      {error ? (
        <p className="text-danger m-0 text-sm" role="alert" data-testid="earn-cashback-error">
          {t(error)}
        </p>
      ) : null}

      <Card
        className="border-accent/20 from-accent/5 bg-linear-to-br to-transparent"
        data-testid="earn-cashback-hero"
      >
        <CardBody className="flex items-start gap-3">
          <div className="bg-accent/15 text-accent flex size-12 items-center justify-center rounded-full">
            <Percent className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground-muted m-0 text-sm">{t('earn.cashback.yourRate')}</p>
            <p
              className="text-foreground m-0 text-2xl font-semibold tabular-nums"
              data-testid="earn-cashback-current-rate"
            >
              {t(currentCashbackKey)}
            </p>
            <p className="text-foreground-muted m-0 mt-1 text-sm leading-relaxed">
              {t('earn.cashback.heroBody')}
            </p>
          </div>
        </CardBody>
      </Card>

      <section aria-labelledby="earn-cashback-matrix-heading" data-testid="earn-cashback-matrix">
        <h2
          id="earn-cashback-matrix-heading"
          className="text-foreground m-0 mb-3 text-lg font-semibold"
        >
          {t('earn.cashback.matrixTitle')}
        </h2>
        <div className="border-border overflow-x-auto rounded-md border">
          <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
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
              {rows.map((row) => (
                <tr
                  key={row.tier}
                  className={cn(
                    'border-border border-t',
                    row.current ? 'bg-accent/5' : undefined,
                  )}
                  data-testid={`earn-cashback-row-${row.tier}`}
                  data-current={row.current ? 'true' : 'false'}
                >
                  <td className="text-foreground px-4 py-3 font-medium">
                    {t(`earn.tier.${row.tier}`)}
                    {row.current ? (
                      <span className="text-accent ml-2 text-xs font-semibold">
                        {t('earn.cashback.currentMark')}
                      </span>
                    ) : null}
                  </td>
                  <td className="text-foreground px-4 py-3 tabular-nums">
                    {t(row.cashbackLabelKey)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Link
        to="/tier/benefits"
        className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'w-fit')}
        data-testid="earn-cashback-benefits-link"
      >
        {t('earn.cashback.benefitsCta')}
      </Link>
    </div>
  );
}
