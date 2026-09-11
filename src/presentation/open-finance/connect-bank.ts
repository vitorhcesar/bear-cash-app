import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type {
  IOpenFinanceModule,
  OpenFinanceConsent,
} from '@/infra/http/services/api/modules/open-finance.module';

export const MAX_OPEN_FINANCE_CONNECTIONS = 5;

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export function openFinanceCallbackUrl(consentId?: string) {
  return Linking.createURL(
    'open-finance/callback',
    consentId ? { queryParams: { consentId } } : undefined,
  );
}

function dismissAuthorizationBrowser() {
  try {
    WebBrowser.dismissAuthSession();
  } catch {
    // Android polyfill uses dismissBrowser instead.
  }
  void WebBrowser.dismissBrowser().catch(() => undefined);
}

async function returnToApp(consentId: string) {
  const callbackUrl = openFinanceCallbackUrl(consentId);
  try {
    await Linking.openURL(callbackUrl);
  } catch {
    dismissAuthorizationBrowser();
  }
}

async function readConsent(client: IOpenFinanceModule, consentId: string) {
  try {
    return await client.refreshConsent(consentId);
  } catch {
    return client.getConsent(consentId);
  }
}

async function openAuthorization(url: string) {
  try {
    await WebBrowser.openAuthSessionAsync(url, Linking.createURL('open-finance/callback'));
  } catch {
    await WebBrowser.openBrowserAsync(url);
  }
}

async function watchAuthorization(
  client: IOpenFinanceModule,
  consent: OpenFinanceConsent,
  emit: (consent: OpenFinanceConsent) => OpenFinanceConsent,
  stopped: { current: boolean },
) {
  let current = consent;

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
      resolve(next);
    };

    const tick = async () => {
      if (stopped.current || settled) {
        finish(current);
        return;
      }

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
        return;
      }

      if (isAuthorizationComplete(current) || isSyncSettled(current)) {
        await returnToApp(consent.id);
        finish(current);
      }
    };

    subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void tick();
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

  if (consent.status !== 'AUTHORISED') {
    const stopped = { current: false };
    const authUrl = consent.urlToAuthenticate;
    const shouldOpenBrowser = Boolean(authUrl) && !isUrlExpired(consent);
    const browserTask = shouldOpenBrowser && authUrl
      ? openAuthorization(authUrl)
      : Promise.resolve();
    const watchTask = watchAuthorization(client, consent, emit, stopped);

    await Promise.race([browserTask, watchTask]);
    stopped.current = true;
    dismissAuthorizationBrowser();
  }

  let current = consent;
  try {
    current = emit(await readConsent(client, consent.id));
  } catch {
    current = emit(await client.getConsent(consent.id));
  }

  if (isSyncSettled(current) || isAuthRejected(current.status)) {
    return current;
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);
    try {
      current = emit(
        isAwaitingAuthorization(current)
          ? await readConsent(client, consent.id)
          : await client.getConsent(consent.id),
      );
    } catch {
      continue;
    }
    if (isSyncSettled(current) || isAuthRejected(current.status)) {
      return current;
    }
    if (isAwaitingAuthorization(current) && isUrlExpired(current)) {
      return current;
    }
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
