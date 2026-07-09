import type { ReactNode } from 'react';

import { ToastZone } from '@/product/primitives/toast-zone';

import { I18nProvider } from './instance';

/**
 * Phase R i18n root — wraps the router so every route and shell chrome can call `useT()`.
 * Sets `document.documentElement.lang` on locale change via `@phonara/i18n/react`.
 */
export function I18nShell({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      {children}
      <ToastZone />
    </I18nProvider>
  );
}
