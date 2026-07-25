import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Globe2, Sparkles } from 'lucide-react';

import {
  EVENTS_HUB_SEO_DESCRIPTION_KEY,
  EVENTS_HUB_SEO_TITLE_KEY,
} from '@/domain/events-hub-display-contract';
import { useEventsHubPageController } from '@/features/earn/use-events-hub-page-controller';
import { Button, buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

/** Canonical `/events` — Golden Earth primary tap + season link cards (P11). */
export function EventsHubPage() {
  const engine = useEventsHubPageController();
  const {
    t,
    loading,
    error,
    status,
    seasonCards,
    tapBlocked,
    tapping,
    remainingLabel,
    earnedTodayLabel,
    globalTotalLabel,
    tapGoldenEarth,
  } = engine;

  useEffect(() => {
    document.title = t(EVENTS_HUB_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-lg flex-col gap-ds-8 py-4"
        data-testid="events-hub-loading"
      >
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-ds-8 py-4 md:py-6"
      data-testid="events-hub-page"
    >
      <header className="flex flex-col gap-2">
        <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
          {t('events.page.eyebrow')}
        </p>
        <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
          {t(EVENTS_HUB_SEO_TITLE_KEY)}
        </h1>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">
          {t(EVENTS_HUB_SEO_DESCRIPTION_KEY)}
        </p>
      </header>

      {error ? (
        <p className="text-danger m-0 text-sm" role="alert" data-testid="events-hub-error">
          {t(error)}
        </p>
      ) : null}

      <Card
        className="border-accent/25 from-accent/10 overflow-hidden bg-linear-to-br to-transparent"
        data-testid="events-golden-earth"
      >
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-accent/15 text-accent flex size-12 items-center justify-center rounded-full">
              <Globe2 className="size-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
                {t('earn.goldenEarth.eyebrow')}
              </p>
              <h2 className="text-foreground m-0 text-lg font-semibold">
                {t('earn.goldenEarth.headline')}
              </h2>
              <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                {t('earn.goldenEarth.subline')}
              </p>
            </div>
          </div>

          {status?.goldenHourActive ? (
            <p
              className="text-accent m-0 inline-flex items-center gap-1.5 text-sm font-medium"
              data-testid="events-golden-hour"
            >
              <Sparkles className="size-4" aria-hidden />
              {t('earn.goldenEarth.goldenHour.badge', {
                minutes: status.goldenHourMinutesLeft ?? 0,
              })}
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-foreground-muted m-0">{t('earn.goldenEarth.counter.label')}</dt>
              <dd className="text-foreground m-0 font-semibold tabular-nums">{globalTotalLabel}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted m-0">{remainingLabel}</dt>
              <dd className="text-foreground m-0 font-semibold tabular-nums">{earnedTodayLabel}</dd>
            </div>
          </dl>

          {status != null && status.globalUntilJackpot > 0 ? (
            <p className="text-foreground-muted m-0 text-sm">
              {t('earn.goldenEarth.milestone.remaining', {
                remaining: status.globalUntilJackpot,
              })}
            </p>
          ) : null}

          <p className="text-foreground-muted m-0 text-xs">{t('earn.goldenEarth.policyNotice')}</p>

          <Button
            type="button"
            size="lg"
            className="min-h-12 w-full"
            disabled={tapBlocked}
            onClick={() => {
              void tapGoldenEarth();
            }}
            data-testid="events-golden-earth-tap"
            aria-label={t('earn.goldenEarth.tap.aria')}
          >
            {tapping ? t('earn.goldenEarth.tap.loading') : t('earn.goldenEarth.tap.label')}
          </Button>
        </CardBody>
      </Card>

      <section className="flex flex-col gap-3" data-testid="events-season-cards">
        <h2 className="text-foreground m-0 text-lg font-semibold">{t('events.season.title')}</h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {seasonCards.map((card) => (
            <li key={card.id}>
              <a
                href={card.route}
                className={cn(
                  'border-border bg-surface-raised hover:border-accent/40 flex items-center gap-3 rounded-md border p-4 transition-colors',
                )}
                data-testid={`events-season-card-${card.id}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-foreground m-0 text-base font-semibold">{t(card.titleKey)}</p>
                  <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                    {t(card.bodyKey)}
                  </p>
                </div>
                <ChevronRight className="text-foreground-muted size-5 shrink-0" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
        <Link
          to="/home/missions"
          search={{ tab: 'viral' }}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-fit px-0')}
          data-testid="events-missions-cta"
        >
          {t('events.page.missionsCta')}
        </Link>
      </section>
    </div>
  );
}
