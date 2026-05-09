import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthState {
  isLoading: boolean;
  user: User | null;
}

interface RoleState {
  isLoadingRole: boolean;
  user: User | null;
  hasRequiredRole: boolean;
}

type CurrentUserRolesResponse = {
  success: boolean;
  data: {
    user_id: string;
    role_ids?: number[];
    role_names: string[];
  };
};

type UsersResponse = {
  success: boolean;
  data: Array<{
    id: string;
    email?: string;
    role_ids?: number[];
    role_names: string[];
  }>;
};

function getApiBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configuredBaseUrl || configuredBaseUrl === 'undefined') {
    return '';
  }

  return configuredBaseUrl.endsWith('/')
    ? configuredBaseUrl.slice(0, -1)
    : configuredBaseUrl;
}

function buildApiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
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

function userHasRequiredRole(
  userRoleNames: string[],
  userRoleIds: number[],
  requiredRole: string,
): boolean {
  const normalizedRequiredRole = requiredRole.trim().toLowerCase();
  const adminRoleNames = new Set(['admin', 'administrador']);
  const requiredRoleId = adminRoleNames.has(normalizedRequiredRole) ? 1 : null;

  if (requiredRoleId !== null && userRoleIds.includes(requiredRoleId)) {
    return true;
  }

  return userRoleNames.some((roleName) => {
    const normalizedRoleName = roleName.trim().toLowerCase();

    return (
      normalizedRoleName === normalizedRequiredRole ||
      normalizedRoleName.includes(normalizedRequiredRole) ||
      normalizedRequiredRole.includes(normalizedRoleName)
    );
  });
}

export function useAuthRequiredRol(requiredRole: string): RoleState {
  const router = useRouter();
  const bypassAuth =
    process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true' ||
    process.env.NODE_ENV === 'test';
  const [isLoadingRole, setIsLoadingRole] = useState(!bypassAuth);
  const [user, setUser] = useState<User | null>(null);
  const [hasRequiredRole, setHasRequiredRole] = useState(bypassAuth);

  useEffect(() => {
    if (bypassAuth) {
      return;
    }

    let isMounted = true;

    const checkRole = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user || !session.access_token) {
          if (isMounted) {
            setUser(null);
            setHasRequiredRole(false);
            setIsLoadingRole(false);
          }
          router.push('/admin/login');
          return;
        }

        let roleResponse: Response | null = null;
        try {
          roleResponse = await fetch(buildApiUrl('/api/users/me/roles'), {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
        } catch {
          roleResponse = null;
        }

        if (roleResponse?.status === 401) {
          if (isMounted) {
            setUser(null);
            setHasRequiredRole(false);
            setIsLoadingRole(false);
          }
          router.push('/admin/login');
          return;
        }

        let roleNames: string[] = [];
        let roleIds: number[] = [];

        if (roleResponse?.ok) {
          const roleBody: CurrentUserRolesResponse = await roleResponse.json();
          if (roleBody.success) {
            roleNames = roleBody.data.role_names || [];
            roleIds = roleBody.data.role_ids || [];
          }
        }

        if (roleNames.length === 0) {
          let usersResponse: Response;
          try {
            usersResponse = await fetch(buildApiUrl('/api/users'), {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });
          } catch {
            if (isMounted) {
              setUser(session.user);
              setHasRequiredRole(false);
              setIsLoadingRole(false);
            }
            router.push('/admin/accessDenied');
            return;
          }

          if (usersResponse.status === 401) {
            if (isMounted) {
              setUser(null);
              setHasRequiredRole(false);
              setIsLoadingRole(false);
            }
            router.push('/admin/login');
            return;
          }

          if (!usersResponse.ok) {
            if (isMounted) {
              setUser(session.user);
              setHasRequiredRole(false);
              setIsLoadingRole(false);
            }
            router.push('/admin/accessDenied');
            return;
          }

          const usersBody: UsersResponse = await usersResponse.json();
          if (!usersBody.success) {
            if (isMounted) {
              setUser(session.user);
              setHasRequiredRole(false);
              setIsLoadingRole(false);
            }
            router.push('/admin/accessDenied');
            return;
          }

          const normalizedSessionEmail = session.user.email?.trim().toLowerCase();
          const currentUser = usersBody.data.find((listedUser) => {
            if (listedUser.id === session.user.id) {
              return true;
            }

            if (!normalizedSessionEmail) {
              return false;
            }

            const listedUserEmail =
              typeof listedUser.email === 'string'
                ? listedUser.email.trim().toLowerCase()
                : null;

            return listedUserEmail === normalizedSessionEmail;
          });
          roleNames = currentUser?.role_names || [];
          roleIds = currentUser?.role_ids || [];
        }

        if ((!roleResponse || !roleResponse.ok) && roleNames.length === 0) {
          if (isMounted) {
            setUser(session.user);
            setHasRequiredRole(false);
            setIsLoadingRole(false);
          }
          router.push('/admin/accessDenied');
          return;
        }

        const hasRole = userHasRequiredRole(roleNames, roleIds, requiredRole);

        if (isMounted) {
          setUser(session.user);
          setHasRequiredRole(hasRole);
          setIsLoadingRole(false);
        }

        if (!hasRole) {
          router.push('/admin/accessDenied');
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setHasRequiredRole(false);
          setIsLoadingRole(false);
        }
        router.push('/admin/login');
      }
    };

    checkRole();

    return () => {
      isMounted = false;
    };
  }, [router, bypassAuth, requiredRole]);

  return { isLoadingRole, user, hasRequiredRole };
}

export const useAuthRequiredRole = useAuthRequiredRol;
