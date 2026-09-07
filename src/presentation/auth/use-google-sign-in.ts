import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { getErrorMessage } from '@/infra/http/get-error-message';
import {
  isGoogleSignInCanceled,
  signInWithGoogle,
} from '@/infra/auth/google-sign-in';
import { useAuthDraft } from '@/presentation/auth/auth-draft-context';
import { useAuthSession } from '@/presentation/auth/auth-session-context';

export function useGoogleSignIn() {
  const { applyAuthResult } = useAuthSession();
  const { setMethod, setEmail, resetDraft } = useAuthDraft();
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithGoogle();
      setMethod('google');
      setEmail(result.user.email);
      await applyAuthResult(result);
      if (result.profile.onboardingCompleted) {
        resetDraft();
      }
    } catch (error) {
      if (isGoogleSignInCanceled(error)) {
        return;
      }

      Alert.alert(
        'Google',
        getErrorMessage(error, 'Não foi possível entrar com o Google. Tente novamente.'),
      );
    } finally {
      setLoading(false);
    }
  }, [applyAuthResult, loading, resetDraft, setEmail, setMethod]);

  return { signIn, loading };
}
