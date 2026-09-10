import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type {
  IOpenFinanceModule,
  OpenFinanceConsent,
} from '@/infra/http/services/api/modules/open-finance.module';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isAuthRejected(status: string) {
  return status === 'REJECTED' || status === 'EXPIRED';
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

async function openAuthorization(url: string) {
  try {
    await WebBrowser.openAuthSessionAsync(url, Linking.createURL('open-finance/callback'));
  } catch {
    await WebBrowser.openBrowserAsync(url);
  }
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

  if (consent.urlToAuthenticate && !isUrlExpired(consent)) {
    await openAuthorization(consent.urlToAuthenticate);
  }

  let current = consent;
  try {
    current = emit(await client.refreshConsent(consent.id));
  } catch {
    current = emit(await client.getConsent(consent.id));
  }

  if (isSyncSettled(current) || isAuthRejected(current.status)) {
    return current;
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);
    current = emit(await client.getConsent(consent.id));
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
  const recreated = await client.recreateConsent(consentId);
  options?.onUpdate?.(recreated);
  return authorizeOpenFinanceConsent(client, recreated, options);
}
