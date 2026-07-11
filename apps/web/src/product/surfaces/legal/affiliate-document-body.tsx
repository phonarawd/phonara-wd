import { LEGAL_AFFILIATE_SECTION_IDS, legalAffiliateSectionKey } from '@/domain/legal-display-contract';
import { useT } from '@/product/i18n';

import { LegalSection } from './legal-section';

/** Affiliate / referral terms sections — i18n `legal.affiliate.s*` keys only (ui_only). */
export function AffiliateDocumentBody() {
  const t = useT();

  return (
    <div className="flex flex-col gap-6" data-testid="legal-body-affiliate">
      {LEGAL_AFFILIATE_SECTION_IDS.map((sectionId) => (
        <LegalSection
          key={sectionId}
          id={`affiliate-${sectionId}`}
          title={t(legalAffiliateSectionKey(sectionId, 'title'))}
        >
          {t(legalAffiliateSectionKey(sectionId, 'body'))}
        </LegalSection>
      ))}
    </div>
  );
}
