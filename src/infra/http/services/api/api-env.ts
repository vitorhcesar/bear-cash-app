import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Host da máquina de desenvolvimento (mesmo IP do Metro).
 * No Android emulator, `localhost` aponta para o emulador — não para o PC.
 */
function getDevMachineHost(): string | null {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.easConfig?.projectId ? null : null,
    // Expo Go / legacy manifests
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2
      ?.extra?.expoClient?.hostUri,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost,
    (Constants as { experienceUrl?: string }).experienceUrl,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      if (candidate.includes('://')) {
        const hostname = new URL(candidate).hostname;
        if (hostname) return hostname;
      }

      const host = candidate.split(':')[0]?.trim();
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    } catch {
      // ignore parse errors
    }
  }

  return null;
}

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

  // Explicit non-localhost URL always wins (device físico / staging).
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv.replace(/\/$/, '');
  }

  const portMatch = fromEnv?.match(/:(\d+)\s*$/);
  const port = portMatch?.[1] ?? '3333';
  const host = getDevMachineHost();

  if (host) {
    return `http://${host}:${port}`;
  }

  // Emulador Android clássico: 10.0.2.2 = host loopback
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }

  return fromEnv?.replace(/\/$/, '') || `http://localhost:${port}`;
}

/**
 * Base URL da API BearCash.
 * Em Android/iOS no Expo, deriva o IP do Metro quando .env usa localhost.
 */
export const API_BASE_URL = resolveApiBaseUrl();
