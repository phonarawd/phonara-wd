import { LEGAL_TERMS_SECTION_IDS, legalTermsSectionKey } from '@/domain/legal-display-contract';
import { useT } from '@/product/i18n';

import { LegalSection } from './legal-section';

/** Terms of service sections — i18n `legal.terms.s*` keys only (ui_only). */
export function TermsDocumentBody() {
  const t = useT();

  return (
    <div className="flex flex-col gap-6" data-testid="legal-body-terms">
      {LEGAL_TERMS_SECTION_IDS.map((sectionId) => (
        <LegalSection
          key={sectionId}
          id={`terms-${sectionId}`}
          title={t(legalTermsSectionKey(sectionId, 'title'))}
        >
          {t(legalTermsSectionKey(sectionId, 'body'))}
        </LegalSection>
      ))}
      <LegalSection id="terms-services" title={t('auth.entry.terms.r12.services.title')}>
        {t('auth.entry.terms.r12.services.body')}
      </LegalSection>
    </div>
  );
}
