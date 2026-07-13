import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

import {
  FEATURES_HUB_CARDS,
  FEATURES_HUB_SEO_DESCRIPTION_KEY,
  FEATURES_HUB_SEO_TITLE_KEY,
} from '@/domain/features-hub-display-contract';
import { useT } from '@/product/i18n';

import { MarketingPageLayout } from './marketing-page-layout';

/** Canonical public `/features` hub (P12). */
export function FeaturesHubPage() {
  const t = useT();

  useEffect(() => {
    document.title = t(FEATURES_HUB_SEO_TITLE_KEY);
  }, [t]);

  return (
    <MarketingPageLayout
      testId="features-hub-page"
      eyebrow={t('features.hub.eyebrow')}
      title={t(FEATURES_HUB_SEO_TITLE_KEY)}
      lead={t(FEATURES_HUB_SEO_DESCRIPTION_KEY)}
    >
      <ul className="m-0 flex list-none flex-col gap-3 p-0" data-testid="features-hub-cards">
        {FEATURES_HUB_CARDS.map((card) => (
          <li key={card.id}>
            <Link
              to={card.route}
              className="border-border bg-surface-raised hover:border-accent/40 flex items-center gap-3 rounded-md border p-4 transition-colors"
              data-testid={`features-hub-card-${card.id}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-foreground m-0 text-base font-semibold">{t(card.titleKey)}</p>
                <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                  {t(card.bodyKey)}
                </p>
              </div>
              <ChevronRight className="text-foreground-muted size-5 shrink-0" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </MarketingPageLayout>
  );
}
