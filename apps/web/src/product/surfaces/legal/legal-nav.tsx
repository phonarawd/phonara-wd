import { Link } from '@tanstack/react-router';

import { LEGAL_DOC_ROUTES, type LegalDocId } from '@/domain/legal-display-contract';
import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

const LEGAL_NAV_ITEMS: Readonly<
  Array<{
    id: LegalDocId;
    href: string;
    labelKey: 'legal.nav.terms' | 'legal.nav.privacy' | 'legal.nav.rg' | 'legal.nav.risk';
  }>
> = [
  { id: 'terms', href: LEGAL_DOC_ROUTES.terms, labelKey: 'legal.nav.terms' },
  { id: 'privacy', href: LEGAL_DOC_ROUTES.privacy, labelKey: 'legal.nav.privacy' },
  { id: 'rg', href: LEGAL_DOC_ROUTES.rg, labelKey: 'legal.nav.rg' },
  { id: 'risk', href: LEGAL_DOC_ROUTES.risk, labelKey: 'legal.nav.risk' },
];

export type LegalNavProps = {
  active: LegalDocId;
};

/** Cross-link nav for auth-cluster legal documents (one canonical URL per doc). */
export function LegalNav({ active }: LegalNavProps) {
  const t = useT();

  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label={t('legal.nav.ariaLabel')}
      data-testid="legal-nav"
    >
      {LEGAL_NAV_ITEMS.map((item) => {
        const isActive = item.id === active;

        return (
          <Link
            key={item.id}
            to={item.href}
            className={cn(
              'rounded-(--ds-radius-md) border px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-foreground-muted hover:text-foreground hover:border-line-strong',
            )}
            aria-current={isActive ? 'page' : undefined}
            data-testid={`legal-nav-${item.id}`}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
