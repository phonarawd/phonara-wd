import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { Route as rootRoute } from './routes/__root';
import { adminDeskRoute } from './routes/admin-desk';
import { Route as indexRoute } from './routes/index';
import { Route as loginRoute } from './routes/login';
import { Route as overviewRoute } from './routes/overview';
import { Route as queuesRoute } from './routes/queues';
import { Route as auditRoute } from './routes/audit';
import { Route as operationsRoute } from './routes/operations';
import { Route as alertsRoute } from './routes/alerts';
import { Route as mfaEnrollRoute } from './routes/mfa-enroll';
import { Route as mfaChallengeRoute } from './routes/mfa-challenge';
import { Route as mfaPolicyRoute } from './routes/mfa-policy';
import { Route as usersRoute } from './routes/users';
import { Route as settingsRoute } from './routes/settings';
import { Route as sportsRoute } from './routes/sports';
import { Route as casinoRoute } from './routes/casino';
import { Route as earnRoute } from './routes/earn';
import { Route as cmsRoute } from './routes/cms';
import { AuthProvider } from './contexts/auth-context';
import { I18nProvider } from './lib/i18n';
import { queryClient } from './lib/query';
import { Toaster } from './components/ui/sonner';
import './presentation-import/styles/admin-lovable-globals.css';
import './theme.css';
import './presentation-import/styles/admin-legacy-shell.css';

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  mfaEnrollRoute,
  mfaChallengeRoute,
  adminDeskRoute.addChildren([
    mfaPolicyRoute,
    overviewRoute,
    alertsRoute,
    queuesRoute,
    auditRoute,
    operationsRoute,
    usersRoute,
    settingsRoute,
    sportsRoute,
    casinoRoute,
    earnRoute,
    cmsRoute,
  ]),
]);

const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </I18nProvider>
  </StrictMode>,
);
