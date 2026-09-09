import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_TOKEN_KEY = 'bear-cash.session.token';
const SESSION_EXPIRES_KEY = 'bear-cash.session.expiresAt';

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export type StoredSession = {
  token: string;
  expiresAt: string;
};

export async function saveSession(session: StoredSession) {
  await setItem(SESSION_TOKEN_KEY, session.token);
  await setItem(SESSION_EXPIRES_KEY, session.expiresAt);
}

export async function getSessionToken(): Promise<string | null> {
  const token = await getItem(SESSION_TOKEN_KEY);
  const expiresAt = await getItem(SESSION_EXPIRES_KEY);

  if (!token) {
    return null;
  }

  if (expiresAt) {
    const expiresMs = Date.parse(expiresAt);
    if (!Number.isNaN(expiresMs) && expiresMs <= Date.now()) {
      await clearSession();
      return null;
    }
  }

  return token;
}

export async function clearSession() {
  await deleteItem(SESSION_TOKEN_KEY);
  await deleteItem(SESSION_EXPIRES_KEY);
}
