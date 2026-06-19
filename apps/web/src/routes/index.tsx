import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Route as rootRoute } from './__root';
import { useAuth } from '../contexts/auth-context';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedLandingPage } from '../presentation-import/pages/landing-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});

function IndexPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (session) {
      void navigate({ to: '/home' });
    }
  }, [session, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="grid w-full max-w-sm gap-4 p-5" aria-busy="true">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-20" />
        </Card>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="grid w-full max-w-sm gap-4 p-5" aria-busy="true">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-20" />
        </Card>
      </div>
    );
  }

  return (
    <PresentationRoot>
      <ImportedLandingPage />
    </PresentationRoot>
  );
}
