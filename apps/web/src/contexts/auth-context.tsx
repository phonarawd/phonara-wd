import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { markHasAccount } from '../lib/auth-account-marker';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  refreshSession: () => Promise<Session | null>;
  setAuthSession: (session: Session | null) => void;
}

/** Fail-open when session probe hangs (headless CI / slow local stack). */
const AUTH_BOOTSTRAP_TIMEOUT_MS = 10_000;

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  refreshSession: async () => null,
  setAuthSession: () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const setAuthSession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setLoading(false);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        await supabase.auth.signOut({ scope: 'local' });
        setSession(null);
        return null;
      }
      setSession(data.session);
      return data.session;
    } catch {
      await supabase.auth.signOut({ scope: 'local' });
      setSession(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const bootstrapTimeout = window.setTimeout(() => {
      setLoading((prev) => (prev ? false : prev));
    }, AUTH_BOOTSTRAP_TIMEOUT_MS);

    void refreshSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, nextSession) => {
      if (event === 'SIGNED_IN' && nextSession) {
        markHasAccount();
      }
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      window.clearTimeout(bootstrapTimeout);
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ session, loading, refreshSession, setAuthSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
