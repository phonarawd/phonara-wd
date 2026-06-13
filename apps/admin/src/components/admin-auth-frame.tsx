import type { ReactNode } from 'react';
import { useT } from '../lib/i18n';

export interface AdminAuthFrameProps {
  children: ReactNode;
  testId?: string;
  /** Wider card for MFA QR enrollment. */
  size?: 'sm' | 'md';
}

export function AdminAuthBrand() {
  const t = useT();

  return (
    <div className="mb-6 space-y-2 text-center">
      <div className="mx-auto flex w-fit items-center gap-2">
        <span className="admin-shell-mark" aria-hidden="true">
          P
        </span>
        <p className="text-xs font-bold tracking-widest uppercase text-primary">{t('common.appName')}</p>
      </div>
      <p className="text-xs text-muted">{t('admin.shell.subtitle')}</p>
    </div>
  );
}

AdminAuthBrand.displayName = 'AdminAuthBrand';

/** Glass auth surface shared by login and MFA routes. */
export function AdminAuthFrame({ children, testId, size = 'sm' }: AdminAuthFrameProps) {
  return (
    <div className="admin-auth-shell px-4" data-testid={testId}>
      <div
        className={`admin-auth-card admin-pn-rise${size === 'md' ? ' admin-auth-card-md' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}

AdminAuthFrame.displayName = 'AdminAuthFrame';
