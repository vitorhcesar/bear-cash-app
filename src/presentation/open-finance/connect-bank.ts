import { AppState, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { API_BASE_URL } from '@/infra/http/services/api/api-env';
import type {
  IOpenFinanceModule,
  OpenFinanceConsent,
} from '@/infra/http/services/api/modules/open-finance.module';

export const MAX_OPEN_FINANCE_CONNECTIONS = 5;

const POLL_INTERVAL_MS = 2000;

WebBrowser.maybeCompleteAuthSession();

let openFinanceBrowserSessions = 0;
let skipBiometricUntil = 0;

export function isOpenFinanceBrowserActive() {
  return openFinanceBrowserSessions > 0 || Date.now() < skipBiometricUntil;
}

function beginOpenFinanceBrowserSession() {
  openFinanceBrowserSessions += 1;
}

function endOpenFinanceBrowserSession() {
  openFinanceBrowserSessions = Math.max(0, openFinanceBrowserSessions - 1);
  skipBiometricUntil = Date.now() + 15_000;
}

export function isAuthRejected(status: string) {
  return status === 'REJECTED' || status === 'EXPIRED';
}

export function isAuthorizationComplete(consent: OpenFinanceConsent) {
  return consent.status === 'AUTHORISED' || isAuthRejected(consent.status);
}

export function isSyncSettled(consent: OpenFinanceConsent) {
  if (consent.status !== 'AUTHORISED') {
    return false;
  }
  return (
    consent.executionStatus === 'SUCCESS' ||
    consent.executionStatus === 'PARTIAL_SUCCESS'
  );
}

export function isUrlExpired(consent: OpenFinanceConsent, now = Date.now()) {
  if (!consent.urlToAuthenticateExpiresAt) {
    return false;
  }
  const expiresAt = Date.parse(consent.urlToAuthenticateExpiresAt);
  return !Number.isNaN(expiresAt) && expiresAt <= now;
}

export function isAwaitingAuthorization(consent: OpenFinanceConsent) {
  return consent.status === 'AWAITING_AUTHORIZATION';
}

export function activeOpenFinanceCount(
  connections: Array<{ revokedAt?: string | null }>,
) {
  return connections.filter((item) => !item.revokedAt).length;
}

export function isOpenFinanceConnectionLimitReached(
  connections: Array<{ revokedAt?: string | null; institutionId?: string }>,
  institutionId?: string | null,
) {
  if (activeOpenFinanceCount(connections) < MAX_OPEN_FINANCE_CONNECTIONS) {
    return false;
  }
  if (!institutionId) {
    return true;
  }
  return !connections.some(
    (item) => !item.revokedAt && item.institutionId === institutionId,
  );
}

export function openFinanceConnectionLimitMessage() {
  return `Você pode conectar no máximo ${MAX_OPEN_FINANCE_CONNECTIONS} bancos por enquanto. Desconecte um para adicionar outro.`;
}

export function openFinanceHttpsCallbackUrl(consentId?: string) {
  const url = new URL('/api/v1/open-finance/callback', `${API_BASE_URL}/`);
  if (consentId) {
    url.searchParams.set('consentId', consentId);
  }
  return url.toString();
}

export function openFinanceCallbackUrl(consentId?: string) {
  // iOS ASWebAuthenticationSession intercepts the custom scheme after the
  // HTTPS callback 302. Android Custom Tabs can close on the HTTPS URL itself.
  if (Platform.OS !== 'android') {
    return Linking.createURL(
      'open-finance/callback',
      consentId ? { queryParams: { consentId } } : undefined,
    );
  }

  return openFinanceHttpsCallbackUrl(consentId);
}

function dismissAuthorizationBrowser() {
  try {
    WebBrowser.dismissAuthSession();
  } catch {
    // Android polyfill uses dismissBrowser instead.
  }
  void WebBrowser.dismissBrowser().catch(() => undefined);
}

async function readConsent(client: IOpenFinanceModule, consentId: string) {
  try {
    return await client.refreshConsent(consentId);
  } catch {
    return client.getConsent(consentId);
  }
}

async function openAuthorization(url: string, redirectUrl: string) {
  const options = {
    createTask: false,
    showInRecents: true,
    preferEphemeralSession: false,
  };

  try {
    return await WebBrowser.openAuthSessionAsync(url, redirectUrl, options);
  } catch {
    await WebBrowser.openBrowserAsync(url, options);
    return { type: 'dismiss' as const };
  }
}

async function watchAuthorization(
  client: IOpenFinanceModule,
  consent: OpenFinanceConsent,
  emit: (consent: OpenFinanceConsent) => OpenFinanceConsent,
  stopped: { current: boolean },
) {
  let current = consent;
  let ticking = false;
  let lastAppState = AppState.currentState;

  return new Promise<OpenFinanceConsent>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let subscription: ReturnType<typeof AppState.addEventListener> | undefined;

    const finish = (next: OpenFinanceConsent) => {
      if (settled) {
        return;
      }
      settled = true;
      subscription?.remove();
      if (timer) {
        clearInterval(timer);
      }
      dismissAuthorizationBrowser();
      resolve(next);
    };

    const tick = async () => {
      if (stopped.current || settled || ticking) {
        if (stopped.current && !settled) {
          finish(current);
        }
        return;
      }

      ticking = true;
      try {
        current = emit(
          isAwaitingAuthorization(current)
            ? await readConsent(client, consent.id)
            : await client.getConsent(consent.id),
        );
      } catch {
        if (stopped.current) {
          finish(current);
        }
        ticking = false;
        return;
      }

      if (isAuthorizationComplete(current) || isSyncSettled(current)) {
        finish(current);
        ticking = false;
        return;
      }

      ticking = false;
    };

    subscription = AppState.addEventListener('change', (state) => {
      const previous = lastAppState;
      lastAppState = state;
      if (state !== 'active') {
        return;
      }
      void tick();
      if (previous === 'background' || previous === 'inactive') {
        dismissAuthorizationBrowser();
        finish(current);
      }
    });
    timer = setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);

    void tick();
  });
}

export type AuthorizeOpenFinanceOptions = {
  onUpdate?: (consent: OpenFinanceConsent) => void;
};

export async function authorizeOpenFinanceConsent(
  client: IOpenFinanceModule,
  consent: OpenFinanceConsent,
  options?: AuthorizeOpenFinanceOptions,
) {
  const emit = (next: OpenFinanceConsent) => {
    options?.onUpdate?.(next);
    return next;
  };

  if (isSyncSettled(consent) || isAuthRejected(consent.status)) {
    return emit(consent);
  }

  if (consent.status === 'AUTHORISED') {
    return emit(consent);
  }

  const stopped = { current: false };
  const authUrl = consent.urlToAuthenticate;
  const shouldOpenBrowser = Boolean(authUrl) && !isUrlExpired(consent);
  const redirectUrl = openFinanceCallbackUrl(consent.id);

  beginOpenFinanceBrowserSession();
  try {
    const browserTask =
      shouldOpenBrowser && authUrl
        ? openAuthorization(authUrl, redirectUrl)
        : Promise.resolve({ type: 'skip' as const });
    const watchTask = watchAuthorization(client, consent, emit, stopped);

    await Promise.race([browserTask, watchTask]);
    stopped.current = true;
    dismissAuthorizationBrowser();
  } finally {
    stopped.current = true;
    dismissAuthorizationBrowser();
    endOpenFinanceBrowserSession();
  }

  let current = consent;
  try {
    current = emit(await client.getConsent(consent.id));
  } catch {
    current = emit(consent);
  }

  return current;
}

export async function connectOpenFinanceInstitution(
  client: IOpenFinanceModule,
  institutionId: string,
  options?: AuthorizeOpenFinanceOptions,
) {
  const created = await client.createConsent({ institutionId });
  options?.onUpdate?.(created);
  return authorizeOpenFinanceConsent(client, created, options);
}

export async function reconnectOpenFinanceConsent(
  client: IOpenFinanceModule,
  consentId: string,
  options?: AuthorizeOpenFinanceOptions,
) {
  let current: OpenFinanceConsent;
  try {
    current = await client.refreshConsent(consentId);
  } catch {
    current = await client.getConsent(consentId);
  }
  options?.onUpdate?.(current);

  if (
    isSyncSettled(current) ||
    current.status === 'AUTHORISED' ||
    (isAwaitingAuthorization(current) &&
      Boolean(current.urlToAuthenticate) &&
      !isUrlExpired(current))
  ) {
    return authorizeOpenFinanceConsent(client, current, options);
  }

  const recreated = await client.recreateConsent(consentId);
  options?.onUpdate?.(recreated);
  return authorizeOpenFinanceConsent(client, recreated, options);
}
