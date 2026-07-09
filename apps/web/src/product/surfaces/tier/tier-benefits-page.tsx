import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Crown } from 'lucide-react';

import {
  resolveTierBenefitCellKey,
  resolveTierBenefitsMeRoute,
  TIER_BENEFITS_NARRATIVE_BODY_KEY,
  TIER_BENEFITS_NARRATIVE_CURRENT_TIER_KEY,
  TIER_BENEFITS_NARRATIVE_HEADING_KEY,
  TIER_BENEFITS_NARRATIVE_LEAD_KEY,
  TIER_BENEFITS_SEO_DESCRIPTION_KEY,
  TIER_BENEFITS_SEO_TITLE_KEY,
  TIER_BENEFITS_FAQ_KEYS,
} from '@/domain/tier-benefits-display-contract';
import { resolveTierCssVar } from '@/domain/tier-me-display-contract';
import { useTierBenefitsPageController } from '@/features/earn/use-tier-benefits-page-controller';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

/** Canonical `/tier/benefits` — full VIP matrix · decay policy · §3.5 narrative (P7). */
export function TierBenefitsPage() {
  const engine = useTierBenefitsPageController();
  const {
    t,
    loading,
    error,
    currentTier,
    tierSnapshot,
    narrativeSteps,
    benefitRows,
    visibleColumns,
    decayPolicies,
  } = engine;

  useEffect(() => {
    document.title = t(TIER_BENEFITS_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-4"
        data-testid="tier-benefits-loading"
      >
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const tierColorVar = resolveTierCssVar(currentTier);

  return (
    <div
      className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-4 md:py-6"
      data-testid="tier-benefits-page"
    >
      <header className="flex flex-col gap-3">
        <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
          {t('tier.benefits.eyebrow')}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t(TIER_BENEFITS_SEO_TITLE_KEY)}
          </h1>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
            style={{
              background: `color-mix(in oklch, var(${tierColorVar}) 18%, transparent)`,
              color: `var(${tierColorVar})`,
            }}
            data-testid="tier-benefits-current-badge"
          >
            <Crown className="size-4" aria-hidden />
            {t(`earn.tier.${currentTier}`)}
          </span>
        </div>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">
          {t(TIER_BENEFITS_SEO_DESCRIPTION_KEY)}
        </p>
      </header>

      <section
        aria-labelledby="tier-benefits-narrative-heading"
        data-testid="tier-benefits-narrative"
      >
        <h2
          id="tier-benefits-narrative-heading"
          className="text-foreground m-0 mb-3 text-lg font-semibold"
        >
          {t(TIER_BENEFITS_NARRATIVE_HEADING_KEY)}
        </h2>
        <Card>
          <CardBody className="flex flex-col gap-4">
            <p className="text-foreground m-0 text-base font-medium leading-relaxed">
              {t(TIER_BENEFITS_NARRATIVE_LEAD_KEY)}
            </p>
            {tierSnapshot ? (
              <p
                className="text-accent m-0 text-sm font-medium tabular-nums"
                data-testid="tier-benefits-narrative-rpc"
              >
                {t(TIER_BENEFITS_NARRATIVE_CURRENT_TIER_KEY, {
                  tier: t(`earn.tier.${tierSnapshot.tier}`),
                  xp: tierSnapshot.xp.toLocaleString(),
                })}
              </p>
            ) : null}
            <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-3">
              {narrativeSteps.map((step, index) => (
                <li key={step.id}>
                  <Link
                    to={step.route}
                    className="border-border bg-surface-elevated hover:border-accent/40 flex h-full flex-col gap-2 rounded-(--ds-radius-md) border p-4 transition-colors"
                    data-testid={`tier-benefits-narrative-step-${step.id}`}
                  >
                    <span
                      className="bg-accent text-accent-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <span className="text-foreground text-sm font-semibold">
                      {t(step.titleKey)}
                    </span>
                    <span className="text-foreground-muted text-sm leading-relaxed">
                      {t(step.bodyKey)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <p className="text-foreground-muted m-0 text-sm leading-relaxed">
              {t(TIER_BENEFITS_NARRATIVE_BODY_KEY)}
            </p>
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="tier-benefits-matrix-heading">
        <h2
          id="tier-benefits-matrix-heading"
          className="text-foreground m-0 mb-3 text-lg font-semibold"
        >
          {t('tier.benefits.matrixTitle')}
        </h2>
        <Card data-testid="tier-benefits-matrix">
          <CardBody className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-foreground-muted border-border border-b">
                  <th className="pb-2 pr-3 font-medium">{t('tier.guide.table.tier')}</th>
                  {visibleColumns.map((column) => (
                    <th key={column.id} className="pb-2 pr-3 font-medium">
                      {t(column.labelKey)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {benefitRows.map((row) => (
                  <tr
                    key={row.tier}
                    className={cn(
                      'border-border border-b last:border-0',
                      row.current && 'bg-accent/5',
                    )}
                    data-testid={`tier-benefits-row-${row.tier}`}
                  >
                    <td className="text-foreground py-2 pr-3 font-medium">
                      {t(row.tierLabelKey)}
                      {row.current ? (
                        <span className="text-accent ml-2 text-xs">
                          ({t('tier.guide.currentBadge')})
                        </span>
                      ) : null}
                    </td>
                    {visibleColumns.map((column) => (
                      <td
                        key={column.id}
                        className="text-foreground-muted py-2 pr-3 tabular-nums"
                        data-testid={`tier-benefits-cell-${row.tier}-${column.id}`}
                      >
                        {t(resolveTierBenefitCellKey(row, column.id))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="tier-benefits-decay-heading">
        <h2
          id="tier-benefits-decay-heading"
          className="text-foreground m-0 mb-3 text-lg font-semibold"
        >
          {t('tier.benefits.decayTitle')}
        </h2>
        <Card data-testid="tier-benefits-decay">
          <CardBody className="flex flex-col gap-4">
            {decayPolicies.map((policy) => (
              <div
                key={policy.tier}
                className="border-border flex flex-col gap-1 border-b pb-4 last:border-0 last:pb-0"
                data-testid={`tier-benefits-decay-${policy.tier}`}
              >
                <p className="text-foreground m-0 text-sm font-semibold">
                  {t(policy.tierLabelKey)}
                </p>
                <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                  {t(policy.conditionKey)}
                </p>
                {policy.maintenanceWindowDays != null ? (
                  <p className="text-foreground-muted m-0 text-xs">
                    {t('tier.me.decay.policyWindow', { days: policy.maintenanceWindowDays })}
                  </p>
                ) : null}
              </div>
            ))}
            <p className="text-foreground-muted m-0 text-xs leading-relaxed">
              {t('tier.me.decay.disclaimer')}
            </p>
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="tier-benefits-faq-heading">
        <h2
          id="tier-benefits-faq-heading"
          className="text-foreground m-0 mb-3 text-lg font-semibold"
        >
          {t('tier.guide.faq.heading')}
        </h2>
        <Card data-testid="tier-benefits-faq">
          <CardBody className="flex flex-col gap-4">
            {TIER_BENEFITS_FAQ_KEYS.map((item) => (
              <div key={item.q} className="flex flex-col gap-1">
                <p className="text-foreground m-0 text-sm font-medium">{t(item.q)}</p>
                <p className="text-foreground-muted m-0 text-sm leading-relaxed">{t(item.a)}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </section>

      <Link
        to={resolveTierBenefitsMeRoute()}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'text-foreground-muted w-fit px-0',
        )}
        data-testid="tier-benefits-me-link"
      >
        {t('tier.benefits.meLink')}
        <ChevronRight className="size-4" aria-hidden />
      </Link>

      {error ? (
        <p className="text-destructive m-0 text-sm" role="alert" data-testid="tier-benefits-error">
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
