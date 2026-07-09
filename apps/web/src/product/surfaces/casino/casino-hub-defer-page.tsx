import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Dices } from 'lucide-react';

import {
  CASINO_HUB_DEFER_TODO,
  resolveCasinoHubDeferReasonKey,
} from '@/domain/dead-controls-display-contract';
import { CASINO_HUB_ROUTE } from '@/domain/tournaments-pf-admin-display-contract';
import { useT } from '@/product/i18n';
import { Card, CardBody } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';

/** Canonical `/casino` hub — P10 defer stub until game surfaces mount (`p10-casino-replay-and-infra`). */
export function CasinoHubDeferPage() {
  const t = useT();

  useEffect(() => {
    document.title = t('seo.casino.hub.title');
  }, [t]);

  return (
    <section
      className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-4 md:py-6"
      data-testid="casino-hub-defer-page"
      data-engine-todo={CASINO_HUB_DEFER_TODO}
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
          {t('casino.hub.hero.title')}
        </h1>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">
          {t('casino.hub.defer.subtitle')}
        </p>
      </header>

      <Card variant="casino-play" data-testid="casino-hub-play-tile">
        <CardBody className="p-0">
          <EmptyState
            title={t('casino.hub.defer.title')}
            description={t(resolveCasinoHubDeferReasonKey())}
            actionLabel={t('nav.earn')}
            onAction={() => {
              window.location.assign('/home');
            }}
            icon={<Dices className="size-8" aria-hidden />}
          />
        </CardBody>
      </Card>

      <p className="text-foreground-muted m-0 text-xs leading-relaxed" role="status">
        {t('casino.hub.defer.routeNote', { route: CASINO_HUB_ROUTE })}
      </p>

      <Link
        to="/home"
        className="text-accent text-sm font-medium underline-offset-4 hover:underline"
        data-testid="casino-hub-defer-home-link"
      >
        {t('casino.hub.defer.homeCta')}
      </Link>
    </section>
  );
}
