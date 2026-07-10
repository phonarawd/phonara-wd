import type { useSportsPageController } from '@/features/sports/use-sports-page-controller';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { Link } from '@tanstack/react-router';

import {
  SPORTS_RULES_INTRO_KEY,
  SPORTS_RULES_SECTIONS,
} from '@/domain/sports-rules-and-vip-display-contract';

type SportsT = ReturnType<typeof useSportsPageController>['t'];

/** `/sports/rules` — i18n rules copy only · no CMS/engine until optional later. */
export function SportsRulesPanel({ t }: { t: SportsT }) {
  return (
    <div className="flex flex-col gap-4" data-testid="sports-rules-panel">
      <Card>
        <CardHeader>
          <CardTitle>{t('sports.subnav.rules')}</CardTitle>
        </CardHeader>
        <CardBody className="text-foreground-muted space-y-2 text-sm leading-relaxed">
          <p className="m-0">{t(SPORTS_RULES_INTRO_KEY)}</p>
        </CardBody>
      </Card>

      {SPORTS_RULES_SECTIONS.map((section) => (
        <Card key={section.id} data-testid={`sports-rules-section-${section.id}`}>
          <CardHeader>
            <CardTitle className="text-base">{t(section.titleKey)}</CardTitle>
          </CardHeader>
          <CardBody className="text-foreground-muted space-y-2 text-sm leading-relaxed">
            <p className="m-0">{t(section.bodyKey)}</p>
            {section.id === 'responsible' ? (
              <Link
                to="/legal/responsible-gaming"
                className="text-accent m-0 inline-flex text-sm font-medium no-underline"
                data-testid="sports-rules-responsible-link"
              >
                {t('sports.rules.responsible.link')}
              </Link>
            ) : null}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
