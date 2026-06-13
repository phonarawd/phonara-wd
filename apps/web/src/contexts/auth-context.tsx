import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  refreshSession: () => Promise<Session | null>;
  setAuthSession: (session: Session | null) => void;
}

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
    void refreshSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
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
