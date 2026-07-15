import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';

import {
  PLATFORM_TRUST_STRIP_KEYS,
  TRUST_HUB_BLOCKS,
  TRUST_HUB_SEO_DESCRIPTION_KEY,
  TRUST_HUB_SEO_TITLE_KEY,
} from '@/domain/trust-hub-display-contract';
import { useT } from '@/product/i18n';
import { Card, CardBody } from '@/product/primitives/card';

import { MarketingPageLayout } from './marketing-page-layout';

/** Canonical public `/security` — trust center narrative (P12 · Financial tone · emoji 0). */
export function TrustSecurityPage() {
  const t = useT();

  useEffect(() => {
    document.title = t(TRUST_HUB_SEO_TITLE_KEY);
  }, [t]);

  return (
    <MarketingPageLayout
      testId="trust-security-page"
      eyebrow={t('trust.hub.eyebrow')}
      title={t(TRUST_HUB_SEO_TITLE_KEY)}
      lead={t(TRUST_HUB_SEO_DESCRIPTION_KEY)}
    >
      <p className="text-foreground m-0 text-sm leading-relaxed" data-testid="trust-hub-lead">
        {t('trust.hub.lead')}
      </p>

      <ul
        className="m-0 flex list-none flex-wrap gap-2 p-0"
        data-testid="trust-hub-strip"
        aria-label={t('trust.hub.stripAria')}
      >
        {PLATFORM_TRUST_STRIP_KEYS.map((key) => (
          <li
            key={key}
            className="border-border bg-surface-raised text-foreground-muted rounded-full border px-3 py-1 text-xs font-medium"
          >
            {t(key)}
          </li>
        ))}
      </ul>

      <section aria-labelledby="trust-hub-blocks-heading" data-testid="trust-hub-blocks">
        <h2 id="trust-hub-blocks-heading" className="sr-only">
          {t('trust.hub.blocksHeading')}
        </h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {TRUST_HUB_BLOCKS.map((block) => (
            <li key={block.id}>
              <Card data-testid={`trust-hub-block-${block.id}`}>
                <CardBody className="flex flex-col gap-2">
                  <p className="text-foreground m-0 font-medium">{t(block.titleKey)}</p>
                  <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                    {t(block.bodyKey)}
                  </p>
                  {block.href && block.linkKey ? (
                    <Link
                      to={block.href}
                      className="text-accent w-fit text-sm font-medium underline-offset-4 hover:underline"
                      data-testid={`trust-hub-link-${block.id}`}
                    >
                      {t(block.linkKey)}
                    </Link>
                  ) : null}
                  {block.deferred ? (
                    <p
                      className="text-foreground-muted m-0 text-xs"
                      data-testid={`trust-hub-deferred-${block.id}`}
                    >
                      {t('trust.hub.deferred')}
                    </p>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </MarketingPageLayout>
  );
}
