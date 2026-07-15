import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';

import { I18nShell } from '@/product/i18n';
import { ThemeShell } from '@/product/theme/theme-shell';
import '@/product/tokens/index.css';
import { queryClient } from './lib/query';
import { router } from './router';

/** E2E boot marker — set before React paint (smoke tests wait on html[data-e2e-engine="1"]). */
if (import.meta.env['VITE_PHONARA_E2E_ENGINE'] === '1') {
  document.documentElement.dataset['e2eEngine'] = '1';
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <I18nShell>
        <ThemeShell>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </ThemeShell>
      </I18nShell>
    </StrictMode>,
  );
}
