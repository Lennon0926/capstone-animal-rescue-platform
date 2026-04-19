import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthState {
  isLoading: boolean;
  user: User | null;
}

export function useAuthRequired(): AuthState {
  const router = useRouter();
  const bypassAuth =
    process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true' ||
    process.env.NODE_ENV === 'test';
  const [isLoading, setIsLoading] = useState(!bypassAuth);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (bypassAuth) {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!session) {
          router.push('/admin/login');
          return;
        }

        setUser(session.user);
        setIsLoading(false);
      } catch {
        router.push('/admin/login');
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/admin/login');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, bypassAuth]);

  return { isLoading, user };
}
