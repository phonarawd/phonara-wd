import { useT } from '@/product/i18n';

export function SkipLink() {
  const t = useT();

  return (
    <a href="#main-content" className="skip-link">
      {t('pwa.skipLink')}
    </a>
  );
}

SkipLink.displayName = 'SkipLink';
