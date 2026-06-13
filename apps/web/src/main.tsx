import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { router } from './router';
import { queryClient } from './lib/query';
import { I18nProvider } from './lib/i18n';
import { ErrorBoundary } from './components/error-boundary';
import { supabase } from './lib/supabase';
import './theme.css';
import './styles.css';
import './styles/presentation-import-tokens.css';
import './presentation-import/styles/presentation.css';

const QueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      })),
    )
  : null;

const RouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : null;

// DEV-only: expose the Supabase client so E2E (Playwright) can inject a real
// session via `auth.setSession(...)` instead of completing a magic-link flow.
// Excluded from production builds by the `import.meta.env.DEV` guard.
if (import.meta.env.DEV) {
  (window as unknown as { __supabase?: typeof supabase }).__supabase = supabase;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
        <Toaster position="top-center" theme="dark" richColors closeButton />
        {import.meta.env.DEV && QueryDevtools && RouterDevtools ? (
          <Suspense fallback={null}>
            <QueryDevtools initialIsOpen={false} />
            <RouterDevtools router={router} position="bottom-right" />
          </Suspense>
        ) : null}
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>,
);
