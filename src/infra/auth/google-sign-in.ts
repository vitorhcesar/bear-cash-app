import { authClient } from '@/infra/auth/auth-client';
import { completeSocialSession } from '@/infra/auth/social-session';
import { ApiError } from '@/infra/http/api-error';
import type { AuthResult } from '@/infra/http/services/api/modules/auth.module';

export { isSocialSignInCanceled as isGoogleSignInCanceled } from '@/infra/auth/social-session';

export async function signInWithGoogle(): Promise<AuthResult> {
  const { error } = await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/',
  });

  if (error) {
    throw new ApiError(
      error.message || 'Não foi possível entrar com o Google.',
      error.code ? String(error.code) : 'GOOGLE_SIGN_IN_FAILED',
      400,
    );
  }

  return completeSocialSession('Google');
}
