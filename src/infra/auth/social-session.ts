import { authClient, getBetterAuthCookie } from '@/infra/auth/auth-client';
import { saveSession } from '@/infra/auth/session-store';
import { ApiError } from '@/infra/http/api-error';
import { apiService } from '@/infra/http/services/api/api.service';
import type { AuthResult } from '@/infra/http/services/api/modules/auth.module';

function toIso(value: Date | string | undefined): string {
  if (!value) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

function tokenFromCookie(cookie: string): string | null {
  const match = cookie.match(/(?:^|;\s*)(?:__Secure-)?better-auth[._-]session_token=([^;]+)/i);
  if (!match?.[1]) {
    return null;
  }
  return decodeURIComponent(match[1]);
}

export function isSocialSignInCanceled(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: unknown }).message)
        : String(error);
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  return /cancel|cancell?ed|dismiss|closed|ERR_CANCELED|ERR_REQUEST_CANCELED/i.test(
    `${message} ${code}`,
  );
}

export async function completeSocialSession(providerLabel: string): Promise<AuthResult> {
  const sessionResult = await authClient.getSession();
  const session = sessionResult.data?.session;
  const token = session?.token || tokenFromCookie(getBetterAuthCookie());

  if (!token) {
    throw new ApiError(
      `Não foi possível obter a sessão do ${providerLabel}.`,
      `${providerLabel.toUpperCase()}_SESSION_MISSING`,
      401,
    );
  }

  const expiresAt = toIso(session?.expiresAt);
  await saveSession({ token, expiresAt });

  const me = await apiService.modules.auth.me();
  return {
    user: me.user,
    profile: me.profile,
    session: { token, expiresAt },
  };
}
