import { LEGAL_PRIVACY_SECTION_IDS, legalPrivacySectionKey } from '@/domain/legal-display-contract';
import { useT } from '@/product/i18n';

import { LegalSection } from './legal-section';

/** Privacy policy sections — i18n `legal.privacy.s*` keys only (ui_only). */
export function PrivacyDocumentBody() {
  const t = useT();

  return (
    <div className="flex flex-col gap-ds-8" data-testid="legal-body-privacy">
      {LEGAL_PRIVACY_SECTION_IDS.map((sectionId) => (
        <LegalSection
          key={sectionId}
          id={`privacy-${sectionId}`}
          title={t(legalPrivacySectionKey(sectionId, 'title'))}
        >
          {t(legalPrivacySectionKey(sectionId, 'body'))}
        </LegalSection>
      ))}
    </div>
  );
}
