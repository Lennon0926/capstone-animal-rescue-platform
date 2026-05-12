import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { User } from '@supabase/supabase-js';
import { getAuthenticatedHeaders } from '@/lib/apiAuth';
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
    role_names?: string[];
  };
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
  if (adminRoleNames.has(normalizedRequiredRole)) {
    const uniqueRoleIds = [...new Set(userRoleIds)];
    return uniqueRoleIds.length === 1 && uniqueRoleIds[0] === 1;
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

        let headers: Record<string, string>;
        try {
          headers = await getAuthenticatedHeaders();
        } catch {
          if (isMounted) {
            setUser(null);
            setHasRequiredRole(false);
            setIsLoadingRole(false);
          }
          router.push('/admin/login');
          return;
        }

        let currentUserRolesResponse: Response;
        try {
          currentUserRolesResponse = await fetch(buildApiUrl('/api/users/me/roles'), {
            headers,
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

        if (currentUserRolesResponse.status === 401) {
          if (isMounted) {
            setUser(null);
            setHasRequiredRole(false);
            setIsLoadingRole(false);
          }
          router.push('/admin/login');
          return;
        }

        if (!currentUserRolesResponse.ok) {
          if (isMounted) {
            setUser(session.user);
            setHasRequiredRole(false);
            setIsLoadingRole(false);
          }
          router.push('/admin/accessDenied');
          return;
        }

        const currentUserRolesBody: CurrentUserRolesResponse =
          await currentUserRolesResponse.json();
        if (!currentUserRolesBody.success) {
          if (isMounted) {
            setUser(session.user);
            setHasRequiredRole(false);
            setIsLoadingRole(false);
          }
          router.push('/admin/accessDenied');
          return;
        }

        const responseUserId = currentUserRolesBody.data.user_id;
        if (responseUserId !== session.user.id) {
          if (isMounted) {
            setUser(session.user);
            setHasRequiredRole(false);
            setIsLoadingRole(false);
          }
          router.push('/admin/accessDenied');
          return;
        }

        const roleNames = currentUserRolesBody.data.role_names || [];
        const roleIds = (currentUserRolesBody.data.role_ids || [])
          .map((roleId) => Number.parseInt(String(roleId), 10))
          .filter((roleId) => Number.isInteger(roleId) && roleId > 0);
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
