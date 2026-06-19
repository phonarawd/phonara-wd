import { type ReactNode, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import { setLocale } from '../../i18n';
import { PresentationRoot } from './presentation-root';

/** Syncs @/i18n shim locale with provider and wraps Lovable presentation scope. */
export function AdminLovableSurface({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  useEffect(() => {
    setLocale(locale);
  }, [locale]);
  return <PresentationRoot>{children}</PresentationRoot>;
}
