import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type { IOpenFinanceModule, OpenFinanceConsent } from '@/infra/http/services/api/modules/open-finance.module';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTerminalStatus(status: string) {
  return status === 'AUTHORISED' || status === 'REJECTED' || status === 'EXPIRED';
}

async function openAuthorization(url: string) {
  try {
    await WebBrowser.openAuthSessionAsync(url, Linking.createURL('open-finance/callback'));
  } catch {
    await WebBrowser.openBrowserAsync(url);
  }
}

export async function authorizeOpenFinanceConsent(
  client: IOpenFinanceModule,
  consent: OpenFinanceConsent,
) {
  if (consent.status === 'AUTHORISED') {
    return consent;
  }

  if (consent.urlToAuthenticate) {
    await openAuthorization(consent.urlToAuthenticate);
  }

  let current = consent;
  try {
    current = await client.refreshConsent(consent.id);
  } catch {
    current = await client.getConsent(consent.id);
  }

  if (isTerminalStatus(current.status)) {
    return current;
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);
    current = await client.getConsent(consent.id);
    if (isTerminalStatus(current.status)) {
      return current;
    }
  }

  return current;
}

export async function connectOpenFinanceInstitution(
  client: IOpenFinanceModule,
  institutionId: string,
) {
  const created = await client.createConsent({ institutionId });
  return authorizeOpenFinanceConsent(client, created);
}

export async function reconnectOpenFinanceConsent(
  client: IOpenFinanceModule,
  consentId: string,
) {
  const recreated = await client.recreateConsent(consentId);
  return authorizeOpenFinanceConsent(client, recreated);
}
