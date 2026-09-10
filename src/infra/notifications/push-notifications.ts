import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { IPushModule, PushPlatform } from '@/infra/http/services/api/modules/push.module';

const PUSH_TOKEN_KEY = 'bear-cash.push.token';

type NotificationsModule = typeof import('expo-notifications');

function isExpoGo() {
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

function canUseRemotePush() {
  return Platform.OS !== 'web' && !isExpoGo();
}

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (!canUseRemotePush()) {
    return null;
  }

  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

function getExpoProjectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId
  );
}

async function setStoredToken(token: string | null) {
  if (Platform.OS === 'web') {
    if (token) {
      globalThis.localStorage?.setItem(PUSH_TOKEN_KEY, token);
    } else {
      globalThis.localStorage?.removeItem(PUSH_TOKEN_KEY);
    }
    return;
  }

  if (token) {
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    return;
  }

  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}

export async function getStoredPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(PUSH_TOKEN_KEY) ?? null;
  }

  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

export function setupNotificationHandler() {
  if (!canUseRemotePush()) {
    return;
  }

  void loadNotifications().then((Notifications) => {
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  });
}

async function ensureAndroidChannel(Notifications: NotificationsModule) {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Padrão',
    importance: Notifications.AndroidImportance.MAX,
  });
}

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const Notifications = await loadNotifications();
  if (!Notifications) {
    return null;
  }

  await ensureAndroidChannel(Notifications);

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return null;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    return null;
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResult.data || null;
}

export async function registerPushForCurrentUser(api: IPushModule): Promise<string | null> {
  try {
    const token = await getExpoPushToken();
    if (!token) {
      return null;
    }

    const platform: PushPlatform = Platform.OS === 'ios' ? 'ios' : 'android';
    await api.registerDevice(token, platform);
    await setStoredToken(token);
    return token;
  } catch {
    return null;
  }
}

export async function unregisterPushForCurrentUser(api: IPushModule): Promise<void> {
  const token = await getStoredPushToken();
  if (!token) {
    return;
  }

  try {
    await api.unregisterDevice(token);
  } catch {
    // ignore network errors on unregister
  } finally {
    await setStoredToken(null);
  }
}
