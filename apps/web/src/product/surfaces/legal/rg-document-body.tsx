import { LEGAL_RG_SECTION_IDS, legalRgSectionKey } from '@/domain/legal-display-contract';
import { useT } from '@/product/i18n';

import { LegalSection } from './legal-section';

/** Responsible gaming policy sections — i18n `legal.rg.s*` keys only (ui_only). */
export function RgDocumentBody() {
  const t = useT();

  return (
    <div className="flex flex-col gap-6" data-testid="legal-body-rg">
      {LEGAL_RG_SECTION_IDS.map((sectionId) => (
        <LegalSection
          key={sectionId}
          id={`rg-${sectionId}`}
          title={t(legalRgSectionKey(sectionId, 'title'))}
        >
          {t(legalRgSectionKey(sectionId, 'body'))}
        </LegalSection>
      ))}
    </div>
  );
}
