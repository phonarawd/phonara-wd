import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

import { LegalDocumentLayout } from './legal-document-layout';
import { PrivacyDocumentBody } from './privacy-document-body';

/** Canonical `/legal/privacy` surface — i18n-only privacy policy (P3·W2). */
export function PrivacyPage() {
  const t = useT();

  useEffect(() => {
    document.title = t('legal.privacy.pageTitle');
  }, [t]);

  return (
    <LegalDocumentLayout
      testId="legal-privacy-page"
      docId="privacy"
      title={t('legal.privacy.title')}
      intro={t('legal.privacy.intro')}
      footer={
        <Link
          to="/signup"
          className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-full md:w-auto')}
          data-testid="privacy-agree-continue"
        >
          {t('auth.entry.terms.agreeContinue')}
        </Link>
      }
    >
      <PrivacyDocumentBody />
    </LegalDocumentLayout>
  );
}
