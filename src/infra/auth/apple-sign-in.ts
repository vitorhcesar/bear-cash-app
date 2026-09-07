import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { authClient } from '@/infra/auth/auth-client';
import { completeSocialSession } from '@/infra/auth/social-session';
import { ApiError } from '@/infra/http/api-error';
import type { AuthResult } from '@/infra/http/services/api/modules/auth.module';

export { isSocialSignInCanceled as isAppleSignInCanceled } from '@/infra/auth/social-session';

async function signInWithAppleIdToken(): Promise<AuthResult> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new ApiError(
      'A Apple não retornou o token de identidade.',
      'APPLE_SIGN_IN_FAILED',
      400,
    );
  }

  const firstName = credential.fullName?.givenName?.trim();
  const lastName = credential.fullName?.familyName?.trim();
  const email = credential.email?.trim();
  const user =
    firstName || lastName || email
      ? {
          ...(firstName || lastName
            ? {
                name: {
                  ...(firstName ? { firstName } : {}),
                  ...(lastName ? { lastName } : {}),
                },
              }
            : {}),
          ...(email ? { email } : {}),
        }
      : undefined;

  const { error } = await authClient.signIn.social({
    provider: 'apple',
    idToken: {
      token: credential.identityToken,
      ...(user ? { user } : {}),
    },
  });

  if (error) {
    throw new ApiError(
      error.message || 'Não foi possível entrar com a Apple.',
      error.code ? String(error.code) : 'APPLE_SIGN_IN_FAILED',
      400,
    );
  }

  return completeSocialSession('Apple');
}

async function signInWithAppleBrowser(): Promise<AuthResult> {
  const { error } = await authClient.signIn.social({
    provider: 'apple',
    callbackURL: '/',
  });

  if (error) {
    throw new ApiError(
      error.message || 'Não foi possível entrar com a Apple.',
      error.code ? String(error.code) : 'APPLE_SIGN_IN_FAILED',
      400,
    );
  }

  return completeSocialSession('Apple');
}

export async function signInWithApple(): Promise<AuthResult> {
  if (Platform.OS === 'ios') {
    const available = await AppleAuthentication.isAvailableAsync();
    if (available) {
      return signInWithAppleIdToken();
    }
  }

  return signInWithAppleBrowser();
}
