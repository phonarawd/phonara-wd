import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

import { LegalDocumentLayout } from './legal-document-layout';
import { TermsDocumentBody } from './terms-document-body';

/** Canonical `/legal/terms` surface — i18n-only terms of service (P3·W2). */
export function TermsPage() {
  const t = useT();

  useEffect(() => {
    document.title = t('legal.terms.pageTitle');
  }, [t]);

  return (
    <LegalDocumentLayout
      testId="legal-terms-page"
      docId="terms"
      title={t('legal.terms.title')}
      intro={t('legal.terms.intro')}
      footer={
        <Link
          to="/signup"
          className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-full md:w-auto')}
          data-testid="terms-agree-continue"
        >
          {t('auth.entry.terms.agreeContinue')}
        </Link>
      }
    >
      <TermsDocumentBody />
    </LegalDocumentLayout>
  );
}
