import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from './supabase';

export function useAuthRequired() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
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
      } catch (err) {
        console.error('Auth check failed:', err);
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
  }, [router]);

  return { isLoading, user };
}
