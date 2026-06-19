import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/auth-context';
import { getAuthenticatorAssuranceLevel } from '../domain/admin-auth';

/** True when the signed-in admin session has completed MFA (aal2). */
export function useAdminMfaReady(): boolean {
  const { session, loading } = useAuth();
  const { data: ready } = useQuery({
    queryKey: ['admin-mfa-ready', session?.access_token],
    queryFn: async () => {
      const aal = await getAuthenticatorAssuranceLevel();
      return aal?.currentLevel === 'aal2';
    },
    enabled: !loading && !!session,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return ready === true;
}
