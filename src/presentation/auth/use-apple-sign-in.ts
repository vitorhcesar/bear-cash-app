import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { getErrorMessage } from '@/infra/http/get-error-message';
import {
  isAppleSignInCanceled,
  signInWithApple,
} from '@/infra/auth/apple-sign-in';
import { useAuthDraft } from '@/presentation/auth/auth-draft-context';
import { useAuthSession } from '@/presentation/auth/auth-session-context';

export function useAppleSignIn() {
  const { applyAuthResult } = useAuthSession();
  const { setMethod, setEmail, resetDraft } = useAuthDraft();
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithApple();
      setMethod('apple');
      setEmail(result.user.email);
      await applyAuthResult(result, 'apple');
      if (result.profile.onboardingCompleted) {
        resetDraft();
      }
    } catch (error) {
      if (isAppleSignInCanceled(error)) {
        return;
      }

      Alert.alert(
        'Apple',
        getErrorMessage(error, 'Não foi possível entrar com a Apple. Tente novamente.'),
      );
    } finally {
      setLoading(false);
    }
  }, [applyAuthResult, loading, resetDraft, setEmail, setMethod]);

  return { signIn, loading };
}
