import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';

import { LEGAL_PRIVACY_ROUTE } from '@/domain/legal-display-contract';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

import { CookiesDocumentBody } from './cookies-document-body';
import { LegalDocumentLayout } from './legal-document-layout';

/** Canonical `/legal/cookies` — cookies · local storage · §28.5 pixels (P12). */
export function CookiesPage() {
  const t = useT();

  useEffect(() => {
    document.title = t('legal.cookies.pageTitle');
  }, [t]);

  return (
    <LegalDocumentLayout
      testId="legal-cookies-page"
      docId="cookies"
      title={t('legal.cookies.title')}
      intro={t('legal.cookies.intro')}
      footer={
        <Link
          to={LEGAL_PRIVACY_ROUTE}
          className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-full md:w-auto')}
          data-testid="cookies-privacy-cta"
        >
          {t('legal.cookies.privacyCta')}
        </Link>
      }
    >
      <CookiesDocumentBody />
    </LegalDocumentLayout>
  );
}
