import { LEGAL_COOKIES_SECTION_IDS, legalCookiesSectionKey } from '@/domain/legal-display-contract';
import { useT } from '@/product/i18n';

import { LegalSection } from './legal-section';

/** Cookies · pixels policy sections — i18n `legal.cookies.s*` keys only (ui_only · §28.5). */
export function CookiesDocumentBody() {
  const t = useT();

  return (
    <div className="flex flex-col gap-ds-8" data-testid="legal-body-cookies">
      {LEGAL_COOKIES_SECTION_IDS.map((sectionId) => (
        <LegalSection
          key={sectionId}
          id={`cookies-${sectionId}`}
          title={t(legalCookiesSectionKey(sectionId, 'title'))}
        >
          {t(legalCookiesSectionKey(sectionId, 'body'))}
        </LegalSection>
      ))}
    </div>
  );
}
