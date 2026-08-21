import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPremium: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data?.session ?? null;
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await checkPremiumStatus(currentSession.user.id);
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    let authSubscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user) {
            await checkPremiumStatus(newSession.user.id);
          }
        }
      });
      authSubscription = data?.subscription ?? null;
    } catch (err) {
      console.warn('Auth state change listener error:', err);
    }

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  const checkPremiumStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_type, status')
        .eq('user_id', userId)
        .single();

      if (data && data.status === 'active' && data.plan_type !== 'free') {
        setIsPremium(true);
      } else {
        setIsPremium(false);
      }
    } catch {
      setIsPremium(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsPremium(false);
  };

  const upgradeToPremium = async () => {
    window.location.href = '/premium';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isPremium,
        signUp,
        signIn,
        signOut,
        upgradeToPremium,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
