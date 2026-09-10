import { createContext, flushSync, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { router } from 'expo-router';

import { authClient } from '@/infra/auth/auth-client';
import { clearSession, getSessionToken, saveSession } from '@/infra/auth/session-store';
import type { AuthProfile, AuthResult, AuthUser } from '@/infra/http/services/api/modules/auth.module';
import { unregisterPushForCurrentUser } from '@/infra/notifications/push-notifications';
import type { AuthMethod } from '@/presentation/auth/auth-flow';
import { isOauthMethod } from '@/presentation/auth/auth-flow';
import { useSessionTransition } from '@/presentation/auth/session-transition';
import { useApiService } from '@/presentation/hooks/use-api-service';

type AuthSessionContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isAbandoningSession: boolean;
  user: AuthUser | null;
  profile: AuthProfile | null;
  applyAuthResult: (result: AuthResult, source?: AuthMethod) => Promise<void>;
  refreshSession: () => Promise<void>;
  updateAvatar: (avatarKey: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const api = useApiService();
  const { playEnter, playLeave } = useSessionTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isAbandoningSession, setIsAbandoningSession] = useState(false);
  const abandoningSessionRef = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;

  const beginAbandonSession = useCallback(() => {
    abandoningSessionRef.current = true;
    setIsAbandoningSession(true);
  }, []);

  const endAbandonSession = useCallback(() => {
    abandoningSessionRef.current = false;
    setIsAbandoningSession(false);
  }, []);

  const refreshSession = useCallback(async () => {
    const token = await getSessionToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      return;
    }

    try {
      const me = await api.modules.auth.me();
      setUser(me.user);
      setProfile(me.profile);
    } catch {
      await clearSession();
      setUser(null);
      setProfile(null);
    }
  }, [api.modules.auth]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await refreshSession();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  const applyAuthResult = useCallback(async (result: AuthResult, source?: AuthMethod) => {
    await saveSession(result.session);
    setUser(result.user);
    setProfile(result.profile);

    if (!result.profile.onboardingCompleted) {
      router.replace({
        pathname: '/login-email-phone',
        params: {
          method: source && isOauthMethod(source) ? source : 'google',
          email: result.user.email,
        },
      });
      return;
    }

    await playEnter(async () => {
      router.replace('/(tabs)');
    });
  }, [playEnter]);

  const updateAvatar = useCallback(
    async (avatarKey: string) => {
      const me = await api.modules.auth.updateAvatar(avatarKey);
      setUser(me.user);
      setProfile(me.profile);
    },
    [api.modules.auth],
  );

  const signOut = useCallback(async () => {
    if (abandoningSessionRef.current && !userRef.current) {
      router.replace('/');
      return;
    }

    beginAbandonSession();
    try {
      await unregisterPushForCurrentUser(api.modules.push).catch(() => {
        // ignore push cleanup errors on logout
      });

      const logoutRequest = api.modules.auth.logout().catch(() => {
        // ignore network errors on logout
      });

      await Promise.race([
        authClient.signOut().catch(() => {
          // ignore Better Auth cookie cleanup errors
        }),
        new Promise<void>((resolve) => {
          setTimeout(resolve, 1500);
        }),
      ]);
      await clearSession();
      flushSync(() => {
        setUser(null);
        setProfile(null);
      });

      try {
        await playLeave(async () => {
          router.replace('/');
        });
      } catch {
        router.replace('/');
      }

      void Promise.race([
        logoutRequest,
        new Promise<void>((resolve) => {
          setTimeout(resolve, 2500);
        }),
      ]);
    } finally {
      endAbandonSession();
    }
  }, [api.modules.auth, api.modules.push, beginAbandonSession, endAbandonSession, playLeave]);

  const deleteAccount = useCallback(async () => {
    await unregisterPushForCurrentUser(api.modules.push);
    await api.modules.auth.deleteAccount();

    await playLeave(async () => {
      await authClient.signOut().catch(() => {
        // ignore Better Auth cookie cleanup errors
      });
      await clearSession();
      setUser(null);
      setProfile(null);
      router.replace('/');
    });
  }, [api.modules.auth, api.modules.push, playLeave]);

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated: Boolean(user),
      hasCompletedOnboarding: Boolean(profile?.onboardingCompleted),
      isAbandoningSession,
      user,
      profile,
      applyAuthResult,
      refreshSession,
      updateAvatar,
      signOut,
      deleteAccount,
    }),
    [
      isLoading,
      isAbandoningSession,
      user,
      profile,
      applyAuthResult,
      refreshSession,
      updateAvatar,
      signOut,
      deleteAccount,
    ],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return context;
}
