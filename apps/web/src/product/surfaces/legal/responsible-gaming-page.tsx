import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

import { LegalDocumentLayout } from './legal-document-layout';
import { RgDocumentBody } from './rg-document-body';

/** Canonical `/legal/responsible-gaming` surface — i18n-only RG policy (P3·W2). */
export function ResponsibleGamingPage() {
  const t = useT();

  useEffect(() => {
    document.title = t('legal.rg.pageTitle');
  }, [t]);

  return (
    <LegalDocumentLayout
      testId="legal-rg-page"
      docId="rg"
      title={t('legal.rg.title')}
      intro={t('legal.rg.intro')}
      footer={
        <Link
          to="/signup"
          className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-full md:w-auto')}
          data-testid="rg-agree-continue"
        >
          {t('auth.entry.terms.agreeContinue')}
        </Link>
      }
    >
      <RgDocumentBody />
    </LegalDocumentLayout>
  );
}
