import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';

import { I18nShell } from '@/product/i18n';
import '@/styles/admin.css';
import { router } from './router';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <I18nShell>
        <RouterProvider router={router} />
      </I18nShell>
    </StrictMode>,
  );
}
