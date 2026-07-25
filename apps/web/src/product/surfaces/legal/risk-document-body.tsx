import { Link } from '@tanstack/react-router';

import {
  LEGAL_RISK_CARD_IDS,
  LEGAL_RISK_RG_ITEM_IDS,
  LEGAL_RESPONSIBLE_GAMING_ROUTE,
  legalRiskCardKey,
  legalRiskRgItemKey,
} from '@/domain/legal-display-contract';
import { useT } from '@/product/i18n';

import { LegalSection } from './legal-section';

/** Risk disclosure sections — i18n `legal.risk.*` keys only (ui_only). */
export function RiskDocumentBody() {
  const t = useT();

  return (
    <div className="flex flex-col gap-ds-8" data-testid="legal-body-risk">
      {LEGAL_RISK_CARD_IDS.map((cardId) => (
        <LegalSection
          key={cardId}
          id={`risk-${cardId}`}
          title={t(legalRiskCardKey(cardId, 'title'))}
        >
          {t(legalRiskCardKey(cardId, 'body'))}
        </LegalSection>
      ))}

      <LegalSection id="risk-rg" title={t('legal.risk.rg.title')}>
        <ul className="m-0 list-disc space-y-1.5 pl-5">
          {LEGAL_RISK_RG_ITEM_IDS.map((itemId) => (
            <li key={itemId}>{t(legalRiskRgItemKey(itemId))}</li>
          ))}
        </ul>
        <p className="mt-3 mb-0">
          <Link
            to={LEGAL_RESPONSIBLE_GAMING_ROUTE}
            className="text-accent underline-offset-4 hover:underline"
            data-testid="risk-rg-policy-link"
          >
            {t('legal.nav.rg')}
          </Link>
        </p>
      </LegalSection>
    </div>
  );
}
