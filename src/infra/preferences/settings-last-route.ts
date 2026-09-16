import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'bear-cash.settings.last-route';

let memory: string | null | undefined;

export type SettingsNavId =
  | 'banks'
  | 'profile'
  | 'subscription'
  | 'preferences'
  | 'rate'
  | 'password'
  | 'biometrics'
  | 'report'
  | 'support';

export async function getLastSettingsRoute(): Promise<string | null> {
  if (memory !== undefined) {
    return memory;
  }

  const raw =
    Platform.OS === 'web'
      ? (globalThis.localStorage?.getItem(STORAGE_KEY) ?? null)
      : await AsyncStorage.getItem(STORAGE_KEY);

  memory = raw;
  return raw;
}

export async function setLastSettingsRoute(id: SettingsNavId): Promise<void> {
  memory = id;

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(STORAGE_KEY, id);
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEY, id);
}
