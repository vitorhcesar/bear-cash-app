import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  user: AuthUser | null;
  profile: AuthProfile | null;
  applyAuthResult: (result: AuthResult, source?: AuthMethod) => Promise<void>;
  refreshSession: () => Promise<void>;
  updateAvatar: (avatarKey: string) => Promise<void>;
  uploadAvatarPhoto: (uri: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function startIgnored(task: () => Promise<unknown>) {
  try {
    void task().catch(() => {
      // remote cleanup must never block local session changes
    });
  } catch {
    // ignore sync throws from third-party clients
  }
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const api = useApiService();
  const { playEnter, playLeave } = useSessionTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const signingOutRef = useRef(false);

  const clearLocalSession = useCallback(async () => {
    try {
      await clearSession();
    } catch {
      // local store must not block logout
    }
    setUser(null);
    setProfile(null);
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
    if (!result.profile.onboardingCompleted) {
      await saveSession(result.session);
      setUser(result.user);
      setProfile(result.profile);
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
      await saveSession(result.session);
      setUser(result.user);
      setProfile(result.profile);
      await wait(48);
      try {
        router.replace('/(tabs)');
      } catch {
        // Protected app screens become available after setUser
      }
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

  const uploadAvatarPhoto = useCallback(
    async (uri: string) => {
      const me = await api.modules.auth.uploadAvatarPhoto(uri);
      setUser(me.user);
      setProfile(me.profile);
    },
    [api.modules.auth],
  );

  const signOut = useCallback(async () => {
    if (signingOutRef.current) {
      return;
    }

    signingOutRef.current = true;
    try {
      const token = await getSessionToken().catch(() => null);

      startIgnored(() => unregisterPushForCurrentUser(api.modules.push));
      if (token) {
        startIgnored(() => api.modules.auth.logout(token));
      }
      startIgnored(() => Promise.resolve(authClient.signOut()));

      try {
        await playLeave(async () => {
          await clearLocalSession();
          await wait(80);
        });
      } catch {
        // overlay / navigation failures must not keep the user logged in
      }
    } finally {
      await clearLocalSession();
      signingOutRef.current = false;
    }
  }, [api.modules.auth, api.modules.push, clearLocalSession, playLeave]);

  const deleteAccount = useCallback(async () => {
    await unregisterPushForCurrentUser(api.modules.push);
    await api.modules.auth.deleteAccount();

    try {
      await playLeave(async () => {
        startIgnored(() => Promise.resolve(authClient.signOut()));
        await clearLocalSession();
        await wait(80);
      });
    } catch {
      await clearLocalSession();
    }
  }, [api.modules.auth, api.modules.push, clearLocalSession, playLeave]);

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated: Boolean(user),
      hasCompletedOnboarding: Boolean(profile?.onboardingCompleted),
      user,
      profile,
      applyAuthResult,
      refreshSession,
      updateAvatar,
      uploadAvatarPhoto,
      signOut,
      deleteAccount,
    }),
    [
      isLoading,
      user,
      profile,
      applyAuthResult,
      refreshSession,
      updateAvatar,
      uploadAvatarPhoto,
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
