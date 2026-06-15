import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Synchronously hydrate auth from the persisted Supabase token in localStorage
// so guarded pages don't flash a loading spinner on every navigation/refresh.
const readPersistedSession = (): Session | null => {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!url || typeof window === 'undefined') return null;
    const ref = url.match(/https?:\/\/([^.]+)\./)?.[1];
    if (!ref) return null;
    const raw = window.localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const session = parsed?.currentSession ?? parsed;
    if (!session?.access_token || !session?.user) return null;
    if (session.expires_at && session.expires_at * 1000 < Date.now()) return null;
    return session as Session;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialSession = readPersistedSession();
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(!initialSession);
  const initialSessionLoaded = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore the listener's INITIAL_SESSION until getSession() has verified storage.
      // This prevents a transient null event from clearing a hydrated user and
      // sending protected routes back to the landing page.
      if (!initialSessionLoaded.current && event === 'INITIAL_SESSION') return;

      initialSessionLoaded.current = true;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch(() => {
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        initialSessionLoaded.current = true;
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;

    if (data.session) return data;

    if (data.user?.identities && data.user.identities.length === 0) {
      return data;
    }

    const { data: signedInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) throw signInError;

    setSession(signedInData.session);
    setUser(signedInData.user ?? data.user ?? null);

    return {
      ...data,
      session: signedInData.session,
      user: signedInData.user ?? data.user,
    };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    setSession(data.session);
    setUser(data.user ?? null);
    setLoading(false);
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
