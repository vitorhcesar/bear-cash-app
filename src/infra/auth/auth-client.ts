import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import type { BetterAuthClientPlugin } from 'better-auth/client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { API_BASE_URL } from '@/infra/http/services/api/api-env';

WebBrowser.maybeCompleteAuthSession();

const webStorage = {
  getItem(key: string) {
    return globalThis.localStorage?.getItem(key) ?? null;
  },
  setItem(key: string, value: string) {
    globalThis.localStorage?.setItem(key, value);
  },
};

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    expoClient({
      scheme: 'otto',
      storagePrefix: 'otto',
      storage: Platform.OS === 'web' ? webStorage : SecureStore,
    }) as unknown as BetterAuthClientPlugin,
  ],
});

export function getBetterAuthCookie() {
  const client = authClient as typeof authClient & { getCookie?: () => string };
  return client.getCookie?.() ?? '';
}
