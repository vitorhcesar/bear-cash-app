import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PREFERENCES_KEY = 'otto.preferences';

export type AppPreferences = {
  soundsEnabled: boolean;
  vibrationsEnabled: boolean;
  biometricsEnabled: boolean;
  activitiesIncomeVisible: boolean;
  activitiesExpenseVisible: boolean;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  soundsEnabled: false,
  vibrationsEnabled: true,
  biometricsEnabled: false,
  activitiesIncomeVisible: true,
  activitiesExpenseVisible: true,
};

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

export async function getPreferences(): Promise<AppPreferences> {
  const raw = await getItem(PREFERENCES_KEY);
  if (!raw) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      soundsEnabled: Boolean(parsed.soundsEnabled),
      vibrationsEnabled:
        typeof parsed.vibrationsEnabled === 'boolean'
          ? parsed.vibrationsEnabled
          : DEFAULT_PREFERENCES.vibrationsEnabled,
      biometricsEnabled:
        typeof parsed.biometricsEnabled === 'boolean'
          ? parsed.biometricsEnabled
          : DEFAULT_PREFERENCES.biometricsEnabled,
      activitiesIncomeVisible:
        typeof parsed.activitiesIncomeVisible === 'boolean'
          ? parsed.activitiesIncomeVisible
          : DEFAULT_PREFERENCES.activitiesIncomeVisible,
      activitiesExpenseVisible:
        typeof parsed.activitiesExpenseVisible === 'boolean'
          ? parsed.activitiesExpenseVisible
          : DEFAULT_PREFERENCES.activitiesExpenseVisible,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function savePreferences(preferences: AppPreferences) {
  await setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function updatePreferences(
  patch: Partial<AppPreferences>,
): Promise<AppPreferences> {
  const next = { ...(await getPreferences()), ...patch };
  await savePreferences(next);
  return next;
}
