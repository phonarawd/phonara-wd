import type { ReactNode } from 'react';

import { ToastZone } from '@/product/primitives/toast-zone';

import { I18nProvider } from './instance';

/** Admin i18n root — wraps router so every route can call `useT()`. */
export function I18nShell({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      {children}
      <ToastZone />
    </I18nProvider>
  );
}
