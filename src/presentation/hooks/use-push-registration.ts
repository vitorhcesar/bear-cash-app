import { useEffect } from 'react';

import {
  registerPushForCurrentUser,
} from '@/infra/notifications/push-notifications';
import { getPreferences } from '@/infra/preferences/preferences-store';
import { useAuthSession } from '@/presentation/auth/auth-session-context';
import { useApiService } from '@/presentation/hooks/use-api-service';

export function usePushRegistration(enabled: boolean) {
  const { isAuthenticated, hasCompletedOnboarding } = useAuthSession();
  const api = useApiService();

  useEffect(() => {
    if (!enabled || !isAuthenticated || !hasCompletedOnboarding) {
      return;
    }

    let cancelled = false;

    (async () => {
      const preferences = await getPreferences();
      if (cancelled || !preferences.pushEnabled) {
        return;
      }

      await registerPushForCurrentUser(api.modules.push);
    })();

    return () => {
      cancelled = true;
    };
  }, [api.modules.push, enabled, hasCompletedOnboarding, isAuthenticated]);
}
